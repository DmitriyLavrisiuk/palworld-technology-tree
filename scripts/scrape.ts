import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"

import { writeJson } from "./lib/http.ts"
import { log } from "./lib/log.ts"
import { fetchDataTable, fetchPalTable } from "./sources/datatable.ts"
import { fetchDescriptions, fetchElementNames, fetchPalNames, fetchWorkNames } from "./sources/l10n.ts"
import { fetchItemNames, fetchPalList, fetchRecipe, fetchTechList, toSlug } from "./sources/paldb.ts"
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
import {
  ELEMENT_ORDER,
  WORK_ORDER,
  type ElementNames,
  type Pal,
  type PalsFile,
  type WorkNames,
} from "../src/types/pal.ts"

const OUT = {
  technologies: "src/data/technologies.json",
  recipes: "src/data/recipes.json",
  chains: "src/data/chains.json",
  pals: "src/data/pals.json",
}

const STAGES = ["techs", "icons", "recipes", "materials", "chains", "pals", "pal-icons"] as const
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
      group: paldbEn?.group ?? (row.unlockBuild.length ? "structure" : "essential"),
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
   * Прошлый файл мог быть записан по старой схеме — например, когда у станции
   * ещё не было идентификатора. Такую запись переиспользовать нельзя: смена
   * схемы должна сама обесценивать кэш, иначе парсер падает на первом же
   * рецепте. Разбор идёт из `.cache`, поэтому пересборка ничего не стоит.
   */
  const currentShape = (recipe: Recipe) =>
    recipe.stations.every((station) => typeof station?.id === "string") &&
    recipe.materials.every((material) => typeof material?.id === "string")

  /**
   * Русские имена станций и материалов выводятся из карты имён на КАЖДОМ
   * прогоне, а не берутся из прошлого файла. Иначе заглушка `ru_Text`,
   * однажды записанная, живёт в данных вечно: рецепты переиспользуются
   * целиком и их локализация больше не пересматривается.
   */
  const localise = (recipe: Recipe): Recipe => ({
    techId: recipe.techId,
    stations: recipe.stations.map((station) => ({
      id: station.id,
      name: {
        en: station.name.en,
        // Русское имя ищется по слагу станции, а не по слагу её английского
        // названия: слаг приходит из ссылки и совпадает с ключом карты имён.
        ru:
          usable(itemNamesRu.get(station.id)) ??
          usable(station.name.ru) ??
          station.name.en,
      },
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

    const cached = known.get(tech.id)
    if (!fresh && cached && currentShape(cached)) {
      recipes.push(localise(cached))
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
        stations: recipe.stations.map((station) => ({
          id: station.slug,
          name: { en: station.name, ru: station.name },
        })),
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

/**
 * Иконки материалов приезжают вместе со страницами рецептов — внутри ссылки
 * на материал уже лежит `img`. Поэтому отдельных запросов к страницам нет,
 * скачиваются только сами картинки, и то один раз: дальше их держит кэш.
 *
 * Каталог отдельный: шесть идентификаторов материалов совпадают с
 * идентификаторами технологий и иначе перезаписали бы их иконки.
 */
async function buildMaterialIcons(technologies: Technology[]) {
  log.step("Material and station icons")

  const materials = new Map<string, string>()
  const stations = new Map<string, string>()

  for (const tech of technologies) {
    let recipe: Awaited<ReturnType<typeof fetchRecipe>> = null
    try {
      recipe = await fetchRecipe(toSlug(tech.name.en), false)
    } catch {
      continue
    }
    if (!recipe) continue
    for (const material of recipe.materials) {
      if (material.icon && !materials.has(material.slug)) materials.set(material.slug, material.icon)
    }
    for (const station of recipe.stations) {
      if (station.icon && !stations.has(station.slug)) stations.set(station.slug, station.icon)
    }
  }

  for (const [label, icons, dir] of [
    ["materials", materials, "public/icons/materials"],
    ["stations", stations, "public/icons/stations"],
  ] as const) {
    const entries = [...icons].map(([id, icon]) => ({ id, icon }))
    log.detail(`${entries.length} distinct ${label}`)
    const result = await downloadIcons(entries, fresh, dir)
    log.done(`${result.saved} ${label} icons → ${dir}`)
    if (result.failed.length) {
      log.warn(`${result.failed.length} failed: ${result.failed.slice(0, 5).join(", ")}`)
    }
  }
}

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

/**
 * Палы: числа из игровой таблицы, имена из дампа локализации — то же
 * распределение авторитета, что у технологий.
 */
async function buildPals(): Promise<PalsFile> {
  log.step("Pals")

  const [table, listed, namesEn, namesRu, workEn, workRu, elemEn, elemRu] = await Promise.all([
    fetchPalTable(fresh),
    fetchPalList(fresh),
    fetchPalNames("en", fresh),
    fetchPalNames("ru", fresh),
    fetchWorkNames("en", fresh),
    fetchWorkNames("ru", fresh),
    fetchElementNames("en", fresh),
    fetchElementNames("ru", fresh),
  ])

  /**
   * Номер Палдекса сам по себе не уникален: у Ламболла есть служебный близнец
   * Quest_Farmer03_SheepBall, у Лизпанка — версия для нефтевышки. Отсечь их по
   * маскам id значило бы гадать, поэтому сверяемся со списком paldb: там ровно
   * те палы, которых игрок может поймать.
   */
  const catalogued = new Set(listed.map((entry) => entry.id))
  const rows = table.filter((row) => catalogued.has(row.id))

  log.info(`${rows.length} pals in the Paldeck (${table.length - rows.length} service rows dropped)`)

  // Список paldb и таблица игры расходятся, когда один из источников отстал
  // на патч. Это не ошибка сборки, но знать о ней надо: молча потерянный пал
  // выглядит как «его просто нет в игре».
  const inTable = new Set(table.map((row) => row.id))
  const unmatched = listed.filter((entry) => !inTable.has(entry.id))
  if (unmatched.length) {
    log.warn(
      `${unmatched.length} pals listed on paldb are missing from the table: ` +
        unmatched.slice(0, 8).map((entry) => entry.id).join(", "),
    )
  }

  const missing: string[] = []

  const pals: Pal[] = rows
    .map((row) => {
      // Регистр ключей в дампе расходится с таблицей: SheepBall против
      // Sheepball. Карты имён построены по нижнему регистру именно поэтому.
      const key = row.id.toLowerCase()
      const en = usable(namesEn[key]?.name) ?? row.id
      const ru = usable(namesRu[key]?.name) ?? en

      if (!namesEn[key]) missing.push(row.id)

      return {
        id: row.id,
        dexNo: row.dexNo,
        dexSuffix: row.dexSuffix,
        name: { en, ru },
        elements: row.elements,
        work: row.work,
        nocturnal: row.nocturnal,
        size: row.size,
        transportSpeed: row.transportSpeed,
      }
    })
    .sort((a, b) => a.dexNo - b.dexNo || a.dexSuffix.localeCompare(b.dexSuffix))

  if (missing.length) {
    log.warn(`${missing.length} pals without a localised name: ${missing.slice(0, 5).join(", ")}`)
  }

  const workNames = {} as WorkNames
  for (const key of WORK_ORDER) {
    workNames[key] = {
      en: usable(workEn[key]) ?? key,
      ru: usable(workRu[key]) ?? usable(workEn[key]) ?? key,
    }
  }

  const elementNames = {} as ElementNames
  for (const key of ELEMENT_ORDER) {
    elementNames[key] = {
      en: usable(elemEn[key]) ?? key,
      ru: usable(elemRu[key]) ?? usable(elemEn[key]) ?? key,
    }
  }

  const file: PalsFile = {
    gameVersion: GAME_VERSION,
    generatedAt: new Date().toISOString().slice(0, 10),
    workNames,
    elementNames,
    pals,
  }

  await writeJson(OUT.pals, file)
  log.done(`${pals.length} pals → ${OUT.pals}`)
  return file
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

  if (runs("pals")) await buildPals()

  if (runs("pal-icons")) {
    log.step("Pal icons")
    const list = await fetchPalList(false)
    const result = await downloadIcons(list, fresh, "public/icons/pals")
    log.done(`${result.saved} pal icons → public/icons/pals`)
    if (result.failed.length) {
      log.warn(`${result.failed.length} pal icons failed: ${result.failed.slice(0, 5).join(", ")}`)
    }
  }

  if (runs("recipes")) await buildRecipes(technologies)
  if (runs("materials")) await buildMaterialIcons(technologies)
  if (runs("chains")) await buildChainsFile(technologies)

  console.log()
  log.done("Done")
}

main().catch((error) => {
  log.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exitCode = 1
})
