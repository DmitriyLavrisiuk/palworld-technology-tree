import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  GAME_VERSION,
  MAX_LEVEL,
  TOTAL_ANCIENT,
  TOTAL_ANCIENT_POINTS,
  TOTAL_REGULAR,
  TOTAL_TECHS,
  TOTAL_TECH_POINTS,
} from "../src/lib/constants.ts"
import type { ChainsFile, Recipe, Technology } from "../src/types/tech.ts"

/**
 * Сторожит сгенерированные данные. Парсер сверяет то же самое во время
 * скачивания, но эти проверки должны идти без сети — иначе патч игры или
 * поломка источника доедут до прода незамеченными. Числа — из DATA_MODEL.md.
 */

const ROOT = join(import.meta.dirname, "..")
const read = <T>(rel: string): T => JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as T

const technologies = read<Technology[]>("src/data/technologies.json")
const recipes = read<Recipe[]>("src/data/recipes.json")
const chains = read<ChainsFile>("src/data/chains.json")

const ids = new Set(technologies.map((tech) => tech.id))

describe("технологии: контрольные суммы", () => {
  it("количество совпадает с игрой", () => {
    expect(technologies).toHaveLength(TOTAL_TECHS)
  })

  it("древних и обычных ровно столько, сколько ожидается", () => {
    const ancient = technologies.filter((tech) => tech.ancient)
    expect(ancient).toHaveLength(TOTAL_ANCIENT)
    expect(technologies.length - ancient.length).toBe(TOTAL_REGULAR)
  })

  it("суммы очков сходятся раздельно по обычным и древним", () => {
    const sum = (list: Technology[]) => list.reduce((acc, tech) => acc + tech.cost, 0)
    expect(sum(technologies.filter((tech) => !tech.ancient))).toBe(TOTAL_TECH_POINTS)
    expect(sum(technologies.filter((tech) => tech.ancient))).toBe(TOTAL_ANCIENT_POINTS)
  })

  it("уровни и цены лежат в игровых диапазонах", () => {
    for (const tech of technologies) {
      expect(tech.level, tech.id).toBeGreaterThanOrEqual(1)
      expect(tech.level, tech.id).toBeLessThanOrEqual(MAX_LEVEL)
      expect(tech.cost, tech.id).toBeGreaterThanOrEqual(1)
      expect(tech.cost, tech.id).toBeLessThanOrEqual(9)
    }
  })
})

describe("технологии: инварианты", () => {
  it("идентификаторы уникальны", () => {
    expect(ids.size).toBe(technologies.length)
  })

  it("каждая строка заполняет ровно одно из unlockBuild и unlockItems", () => {
    const broken = technologies.filter(
      (tech) => Boolean(tech.unlockBuild.length) === Boolean(tech.unlockItems.length),
    )
    expect(broken.map((tech) => tech.id)).toEqual([])
  })

  it("категория выведена согласованно с тем, что технология открывает", () => {
    for (const tech of technologies) {
      const expected = tech.unlockBuild.length ? "Structures" : "Items"
      expect(tech.category, tech.id).toBe(expected)
    }
  })

  it("нет висячих reqTech", () => {
    const dangling = technologies.filter((tech) => tech.reqTech && !ids.has(tech.reqTech))
    expect(dangling.map((tech) => tech.id)).toEqual([])
  })

  it("545 технологий не имеют ни одного пререквизита", () => {
    // Центральный факт проекта: дерева как графа в игре нет. См. DATA_MODEL.md —
    // 545, а не 544: Special_ElectricHatchingPalEgg несёт два гейта сразу.
    const free = technologies.filter(
      (tech) => !tech.reqTech && !tech.reqBoss && !tech.reqResearch,
    )
    expect(free).toHaveLength(545)
  })

  it("настоящих рёбер между технологиями всего 17", () => {
    expect(technologies.filter((tech) => tech.reqTech)).toHaveLength(17)
  })

  it("имена заполнены на обоих языках и не содержат заглушку локали", () => {
    for (const tech of technologies) {
      expect(tech.name.en.length, tech.id).toBeGreaterThan(0)
      expect(tech.name.ru.length, tech.id).toBeGreaterThan(0)
      expect(tech.name.ru, tech.id).not.toMatch(/^[a-z]{2}_Text$/i)
      expect(tech.name.en, tech.id).not.toMatch(/^[a-z]{2}_Text$/i)
    }
  })
})

describe("заглушки локали", () => {
  const PLACEHOLDER = /^[a-z]{2}_Text$/i

  it("не доехали ни до названий станций, ни до материалов", () => {
    // paldb отдаёт `ru_Text` там, где перевода нет. Раньше фильтр стоял
    // только на названиях технологий, и три станции ушли в данные как есть.
    const leaked: string[] = []
    for (const recipe of recipes) {
      for (const station of recipe.stations) {
        if (PLACEHOLDER.test(station.ru) || PLACEHOLDER.test(station.en)) {
          leaked.push(`${recipe.techId}: станция ${station.en}/${station.ru}`)
        }
      }
      for (const material of recipe.materials) {
        if (PLACEHOLDER.test(material.name.ru) || PLACEHOLDER.test(material.name.en)) {
          leaked.push(`${recipe.techId}: материал ${material.id}`)
        }
      }
    }
    expect(leaked).toEqual([])
  })
})

describe("иконки", () => {
  it("для каждой технологии есть файл иконки", () => {
    const missing = technologies
      .map((tech) => tech.id)
      .filter((id) => !existsSync(join(ROOT, "public/icons", `${id}.webp`)))
    expect(missing).toEqual([])
  })
})

describe("рецепты", () => {
  it("их 527 — у сёдел и наборов секции Production нет", () => {
    expect(recipes).toHaveLength(527)
  })

  it("каждый рецепт ссылается на существующую технологию, без дублей", () => {
    const techIds = recipes.map((recipe) => recipe.techId)
    expect(new Set(techIds).size).toBe(recipes.length)
    expect(techIds.filter((id) => !ids.has(id))).toEqual([])
  })

  it("материалы имеют положительное количество и имя на обоих языках", () => {
    for (const recipe of recipes) {
      for (const material of recipe.materials) {
        expect(material.count, `${recipe.techId}/${material.id}`).toBeGreaterThan(0)
        expect(material.name.en.length, material.id).toBeGreaterThan(0)
        expect(material.name.ru.length, material.id).toBeGreaterThan(0)
      }
    }
  })
})

describe("цепочки", () => {
  it("собраны на той же версии игры, что и константы", () => {
    expect(chains.gameVersion).toBe(GAME_VERSION)
  })

  it("все члены, варианты и корзины ссылаются на существующие технологии", () => {
    const referenced = [
      ...chains.chains.flatMap((chain) => chain.members),
      ...chains.chains.flatMap((chain) => Object.values(chain.variants ?? {}).flat()),
      ...chains.buckets.flatMap((bucket) => bucket.members),
      ...chains.loose.flatMap((entry) => entry.members),
    ]
    expect(referenced.filter((id) => !ids.has(id))).toEqual([])
  })

  it("технология попадает ровно в одно место: цепочку, корзину или loose", () => {
    const placements = new Map<string, number>()
    const count = (id: string) => placements.set(id, (placements.get(id) ?? 0) + 1)
    for (const chain of chains.chains) {
      chain.members.forEach(count)
      Object.values(chain.variants ?? {}).flat().forEach(count)
    }
    for (const bucket of chains.buckets) bucket.members.forEach(count)
    for (const entry of chains.loose) entry.members.forEach(count)

    expect([...placements].filter(([, times]) => times > 1)).toEqual([])
    expect(placements.size).toBe(technologies.length)
  })

  it("варианты привязаны к члену своей же цепочки", () => {
    for (const chain of chains.chains) {
      for (const base of Object.keys(chain.variants ?? {})) {
        expect(chain.members, chain.id).toContain(base)
      }
    }
  })

  it("члены цепочки идут по неубыванию уровня", () => {
    const byId = new Map(technologies.map((tech) => [tech.id, tech]))
    for (const chain of chains.chains) {
      const levels = chain.members.map((id) => byId.get(id)!.level)
      expect([...levels].sort((a, b) => a - b), chain.id).toEqual(levels)
    }
  })

  it("у каждой цепочки есть метка достоверности из известного набора", () => {
    for (const chain of chains.chains) {
      expect(["manual", "hard", "stem", "name"], chain.id).toContain(chain.confidence)
    }
  })

  it("настоящих связей игры не больше, чем их есть в данных", () => {
    // Защита от того, что эвристика начнёт выдавать себя за данные игры.
    const hard = chains.chains.filter((chain) => chain.confidence === "hard")
    const members = hard.reduce((sum, chain) => sum + chain.members.length, 0)
    expect(members).toBeLessThanOrEqual(17 * 2)
  })
})
