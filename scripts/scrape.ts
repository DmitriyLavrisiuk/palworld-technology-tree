import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"

import { writeJson } from "./lib/http.ts"
import { log } from "./lib/log.ts"
import { fetchDataTable } from "./sources/datatable.ts"
import { fetchDescriptions } from "./sources/l10n.ts"
import { fetchItemNames, fetchRecipe, fetchTechList, toSlug } from "./sources/paldb.ts"
import { downloadIcons } from "./sources/icons.ts"
import { buildChains, type OverrideFile } from "./build-chains.ts"
import {
  GAME_VERSION,
  TOTAL_ANCIENT,
  TOTAL_ANCIENT_POINTS,
  TOTAL_TECHS,
  TOTAL_TECH_POINTS,
} from "../src/lib/constants.ts"
import type { ChainsFile, Recipe, Technology } from "../src/types/tech.ts"

const OUT = {
  technologies: "src/data/technologies.json",
  recipes: "src/data/recipes.json",
  chains: "src/data/chains.json",
}

const STAGES = ["techs", "icons", "recipes", "chains"] as const
type Stage = (typeof STAGES)[number]

const args = process.argv.slice(2)
const fresh = args.includes("--fresh")
const limitArg = args.find((a) => a.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity
const onlyArg = args.find((a) => a.startsWith("--only="))
const stages: Stage[] = onlyArg
  ? (onlyArg.split("=")[1].split(",") as Stage[])
  : [...STAGES]

const runs = (stage: Stage) => stages.includes(stage)

/**
 * paldb serves an untranslated placeholder ("ru_Text") where a locale is
 * missing, which would otherwise be stored as the display name.
 */
function usable(name: string | undefined): string | null {
  if (!name) return null
  if (/^[a-z]{2}_Text$/i.test(name.trim())) return null
  return name
}

async function readExisting<T>(path: string): Promise<T | null> {
  if (!existsSync(path)) return null
  return JSON.parse(await readFile(path, "utf8")) as T
}

async function buildTechnologies(): Promise<Technology[]> {
  log.step("Technologies")

  const [rows, listEn, listRu, descEn, descRu] = await Promise.all([
    fetchDataTable(fresh),
    fetchTechList("en", fresh),
    fetchTechList("ru", fresh),
    fetchDescriptions("en", fresh),
    fetchDescriptions("ru", fresh),
  ])

  log.detail(`DataTable ${rows.length} · paldb en ${listEn.length} / ru ${listRu.length}`)

  const en = new Map(listEn.map((tech) => [tech.id, tech]))
  const ru = new Map(listRu.map((tech) => [tech.id, tech]))

  const missing: string[] = []
  const mismatched: string[] = []

  const technologies: Technology[] = rows.map((row) => {
    const paldbEn = en.get(row.id)
    const paldbRu = ru.get(row.id)
    if (!paldbEn) missing.push(row.id)

    // paldb is the fresher source for names; the DataTable is authoritative
    // for numbers. Disagreement means one of them lagged a patch.
    if (paldbEn && (paldbEn.level !== row.level || paldbEn.cost !== row.cost)) {
      mismatched.push(row.id)
    }

    const fallbackName = descEn[row.id]?.name ?? row.id

    return {
      id: row.id,
      name: {
        en: usable(paldbEn?.name) ?? usable(descEn[row.id]?.name) ?? fallbackName,
        ru:
          usable(paldbRu?.name) ??
          usable(descRu[row.id]?.name) ??
          usable(paldbEn?.name) ??
          fallbackName,
      },
      description: {
        en: descEn[row.id]?.description ?? "",
        ru: descRu[row.id]?.description ?? descEn[row.id]?.description ?? "",
      },
      level: row.level,
      cost: row.cost,
      ancient: row.ancient,
      category: paldbEn?.category ?? (row.unlockBuild.length ? "Structures" : "Items"),
      iconName: row.iconName,
      reqTech: row.reqTech,
      reqBoss: row.reqBoss,
      reqResearch: row.reqResearch,
      unlockBuild: row.unlockBuild,
      unlockItems: row.unlockItems,
    }
  })

  if (missing.length) log.warn(`${missing.length} ids absent from paldb: ${missing.slice(0, 5).join(", ")}`)
  if (mismatched.length) log.warn(`${mismatched.length} level/cost mismatches vs paldb: ${mismatched.slice(0, 5).join(", ")}`)

  verify(technologies)
  await writeJson(OUT.technologies, technologies)
  log.done(`${technologies.length} technologies → ${OUT.technologies}`)
  return technologies
}

/** Guards against a patch silently changing the shape of the data. */
function verify(technologies: Technology[]) {
  const ancient = technologies.filter((tech) => tech.ancient)
  const regular = technologies.filter((tech) => !tech.ancient)
  const tp = regular.reduce((sum, tech) => sum + tech.cost, 0)
  const atp = ancient.reduce((sum, tech) => sum + tech.cost, 0)
  const levels = technologies.map((tech) => tech.level)

  const checks: [string, number, number][] = [
    ["total", technologies.length, TOTAL_TECHS],
    ["ancient", ancient.length, TOTAL_ANCIENT],
    ["tech points", tp, TOTAL_TECH_POINTS],
    ["ancient points", atp, TOTAL_ANCIENT_POINTS],
  ]

  for (const [label, actual, expected] of checks) {
    if (actual === expected) log.detail(`${label}: ${actual} ✓`)
    else log.warn(`${label}: ${actual}, expected ${expected} — game data may have moved past ${GAME_VERSION}`)
  }

  const both = technologies.filter((t) => t.unlockBuild.length && t.unlockItems.length)
  const neither = technologies.filter((t) => !t.unlockBuild.length && !t.unlockItems.length)
  if (both.length || neither.length) {
    log.warn(`category invariant broken: ${both.length} unlock both, ${neither.length} unlock neither`)
  }

  log.detail(`levels ${Math.min(...levels)}–${Math.max(...levels)}`)
}

async function buildRecipes(technologies: Technology[]) {
  log.step("Recipes")
  log.info(`Fetching detail pages from paldb — ${Math.min(technologies.length, limit)} requests, throttled`)

  const itemNamesRu = await fetchItemNames("ru", fresh)
  log.detail(`material name map: ${itemNamesRu.size} entries`)

  const previous = (await readExisting<Recipe[]>(OUT.recipes)) ?? []
  const known = new Map(previous.map((recipe) => [recipe.techId, recipe]))

  /**
   * Русские имена станций и материалов выводятся из карты имён на КАЖДОМ
   * прогоне, а не берутся из прошлого файла. Иначе заглушка `ru_Text`,
   * однажды записанная, живёт в данных вечно: рецепты переиспользуются
   * целиком и их локализация больше не пересматривается.
   */
  const localise = (recipe: Recipe): Recipe => ({
    techId: recipe.techId,
    stations: recipe.stations.map((station) => ({
      en: station.en,
      ru: usable(itemNamesRu.get(toSlug(station.en))) ?? usable(station.ru) ?? station.en,
    })),
    materials: recipe.materials.map((material) => ({
      ...material,
      name: {
        en: material.name.en,
        ru:
          usable(itemNamesRu.get(material.id)) ??
          usable(material.name.ru) ??
          material.name.en,
      },
    })),
  })

  const recipes: Recipe[] = []
  const misses: string[] = []
  let index = 0

  for (const tech of technologies) {
    if (index >= limit) break
    index++
    log.progress(index, Math.min(technologies.length, limit), "recipes")

    if (!fresh && known.has(tech.id)) {
      recipes.push(localise(known.get(tech.id)!))
      continue
    }

    let recipe: Awaited<ReturnType<typeof fetchRecipe>> = null
    try {
      recipe = await fetchRecipe(toSlug(tech.name.en), fresh)
    } catch (error) {
      log.error(`${tech.name.en}: ${error instanceof Error ? error.message : error}`)
    }

    if (!recipe) {
      misses.push(tech.id)
      continue
    }

    // Русские имена проставляет localise — один источник правды на оба пути.
    recipes.push(
      localise({
        techId: tech.id,
        stations: recipe.stations.map((station) => ({ en: station, ru: station })),
        materials: recipe.materials.map((material) => ({
          id: material.slug,
          name: { en: material.name, ru: material.name },
          count: material.count,
        })),
      }),
    )
  }

  await writeJson(OUT.recipes, recipes)
  log.done(`${recipes.length} recipes → ${OUT.recipes}`)
  if (misses.length) {
    log.warn(`no Production section for ${misses.length} technologies (saddles and sets mostly)`)
    log.detail(misses.slice(0, 8).join(", "))
  }
}

const OVERRIDES = "scripts/chain-overrides.json"

async function buildChainsFile(technologies: Technology[]) {
  log.step("Chains")

  const overrides = (await readExisting<OverrideFile>(OVERRIDES)) ?? { chains: [] }
  if (overrides.chains.length) log.detail(`${overrides.chains.length} hand-written families from ${OVERRIDES}`)

  const result = buildChains(technologies, overrides)
  const file: ChainsFile = {
    gameVersion: GAME_VERSION,
    generatedAt: new Date().toISOString().slice(0, 10),
    chains: result.chains,
    buckets: result.buckets,
    loose: result.loose,
  }

  await writeJson(OUT.chains, file)

  const { stats } = result
  const pct = (n: number) => `${Math.round((n / stats.total) * 100)}%`
  log.done(`${result.chains.length} chains → ${OUT.chains}`)
  log.detail(`in chains ${stats.inChains} (${pct(stats.inChains)}) · bucketed ${stats.bucketed} (${pct(stats.bucketed)}) · ungrouped ${stats.ungrouped} (${pct(stats.ungrouped)})`)
  log.detail(`variants attached: ${stats.variants}`)
  log.detail(`by confidence — manual ${stats.byConfidence.manual} · hard ${stats.byConfidence.hard} · stem ${stats.byConfidence.stem} · name ${stats.byConfidence.name}`)
  log.info(`Correct mistakes in ${OVERRIDES}, not in the generated ${OUT.chains}`)
}

async function main() {
  log.info(`Palworld tech tree scraper · stages: ${stages.join(", ")}${fresh ? " · fresh" : ""}`)

  let technologies = runs("techs")
    ? await buildTechnologies()
    : await readExisting<Technology[]>(OUT.technologies)

  if (!technologies) {
    log.error("No technologies available — run with --only=techs first")
    process.exitCode = 1
    return
  }

  if (runs("icons")) {
    log.step("Icons")
    const listEn = await fetchTechList("en", false)
    const result = await downloadIcons(listEn, fresh)
    log.done(`${result.saved} icons → public/icons`)
    if (result.failed.length) log.warn(`${result.failed.length} icons failed: ${result.failed.slice(0, 5).join(", ")}`)
  }

  if (runs("recipes")) await buildRecipes(technologies)
  if (runs("chains")) await buildChainsFile(technologies)

  console.log()
  log.done("Done")
}

main().catch((error) => {
  log.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exitCode = 1
})
