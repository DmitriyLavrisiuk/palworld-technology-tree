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
import { GROUP_NAMES, GROUP_ORDER } from "../src/lib/constants.ts"
import type { ChainsFile, Recipe, Technology } from "../src/types/tech.ts"
import { WORK_ORDER, type PalsFile } from "../src/types/pal.ts"

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
const palsFile = read<PalsFile>("src/data/pals.json")
const pals = palsFile.pals

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

describe("ручные правки цепочек", () => {
  interface Overrides {
    chains: { id: string; members: string[]; variants?: Record<string, string[]> }[]
    exclude?: string[]
  }
  const overrides = read<Overrides>("scripts/chain-overrides.json")

  it("каждый упомянутый идентификатор существует", () => {
    const mentioned = [
      ...overrides.chains.flatMap((chain) => chain.members),
      ...overrides.chains.flatMap((chain) => Object.keys(chain.variants ?? {})),
      ...overrides.chains.flatMap((chain) => Object.values(chain.variants ?? {}).flat()),
      ...(overrides.exclude ?? []),
    ]
    expect(mentioned.filter((id) => !ids.has(id))).toEqual([])
  })

  it("ни одна ручная семья не потерялась по дороге", () => {
    // Опечатка в id оставляет семье меньше двух членов, и build-chains
    // молча её пропускает: `continue` без предупреждения. Единственная
    // разрешённая поверхность правок обязана быть под присмотром.
    const produced = new Set(
      chains.chains.filter((chain) => chain.confidence === "manual").map((chain) => chain.id),
    )
    const lost = overrides.chains.map((chain) => chain.id).filter((id) => !produced.has(id))
    expect(lost).toEqual([])
  })

  it("исключённые технологии остались в дереве, но вне цепочек", () => {
    const inChains = new Set(chains.chains.flatMap((chain) => chain.members))
    for (const id of overrides.exclude ?? []) {
      expect(ids.has(id), id).toBe(true)
      expect(inChains.has(id), id).toBe(false)
    }
  })
})

describe("станции", () => {
  const stations = new Map(
    recipes.flatMap((recipe) => recipe.stations.map((station) => [station.id, station] as const)),
  )

  it("их 23 и у каждой есть идентификатор", () => {
    expect(stations.size).toBe(23)
    for (const recipe of recipes) {
      for (const station of recipe.stations) {
        expect(station.id.length, recipe.techId).toBeGreaterThan(0)
      }
    }
  })

  it("у каждой станции есть иконка на диске", () => {
    // Каталог отдельный: слаги станций и технологий могут совпасть.
    const missing = [...stations.keys()].filter(
      (id) => !existsSync(join(ROOT, "public/icons/stations", `${id}.webp`)),
    )
    expect(missing).toEqual([])
  })

  it("название станции переведено на оба языка", () => {
    for (const station of stations.values()) {
      expect(station.name.ru.length, station.id).toBeGreaterThan(0)
      expect(station.name.en.length, station.id).toBeGreaterThan(0)
    }
  })

  it("у постройки станций нет — её строят, а не крафтят", () => {
    const byId = new Map(technologies.map((tech) => [tech.id, tech]))
    const wrong = recipes.filter(
      (recipe) => byId.get(recipe.techId)?.category === "Structures" && recipe.stations.length > 0,
    )
    expect(wrong.map((recipe) => recipe.techId).slice(0, 5)).toEqual([])
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
        if (PLACEHOLDER.test(station.name.ru) || PLACEHOLDER.test(station.name.en)) {
          leaked.push(`${recipe.techId}: станция ${station.name.en}/${station.name.ru}`)
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

describe("категория из классификации игры", () => {
  it("у каждой технологии есть категория из известного набора", () => {
    for (const tech of technologies) {
      expect(GROUP_ORDER, tech.id).toContain(tech.group)
    }
  })

  it("постройки по категории — это ровно постройки по данным DataTable", () => {
    // Главное доказательство, что путь ассета несёт настоящую классификацию,
    // а не наше толкование: два независимых источника дают одно множество.
    const byGroup = technologies.filter((tech) => tech.group === "structure").map((t) => t.id)
    const byCategory = technologies.filter((tech) => tech.category === "Structures").map((t) => t.id)
    expect(byGroup.sort()).toEqual(byCategory.sort())
  })

  it("каждая категория переведена на оба языка", () => {
    for (const group of GROUP_ORDER) {
      expect(GROUP_NAMES[group].ru.length, group).toBeGreaterThan(0)
      expect(GROUP_NAMES[group].en.length, group).toBeGreaterThan(0)
    }
  })

  it("ни одна категория не пустует", () => {
    // Пустая секция в интерфейсе — признак того, что таксономия разъехалась
    // с данными после патча.
    const used = new Set(technologies.map((tech) => tech.group))
    expect([...GROUP_ORDER].filter((group) => !used.has(group))).toEqual([])
  })

  it("снаряжение палов совпадает с корзиной сёдел", () => {
    const palgear = technologies.filter((tech) => tech.group === "palgear").length
    const saddles = chains.buckets.find((bucket) => bucket.id === "saddles")?.members.length
    expect(palgear).toBe(saddles)
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

  it("узлов с меткой hard ровно столько, сколько дают связи игры", () => {
    // Точное число, а не потолок: эвристика, притворившаяся данными игры,
    // должна ронять тест сразу, а не после двукратного роста.
    const hard = chains.chains.filter((chain) => chain.confidence === "hard")
    const nodes = hard.reduce(
      (sum, chain) => sum + chain.members.length + Object.values(chain.variants ?? {}).flat().length,
      0,
    )
    expect(nodes).toBe(16)
  })
})

describe("палы: контрольные суммы", () => {
  /**
   * 288, а не 303 из таблицы и не 299 со страницы paldb. Разница объяснима и
   * проверена: 15 строк — служебные близнецы (квестовые копии, версии для
   * нефтевышки) с чужим номером Палдекса, а 11 палов Якусимы есть на paldb,
   * но в зеркале игровой таблицы их ещё нет. Число обязано падать при смене
   * любой из трёх величин — тогда мы про это узнаем.
   */
  it("288 палов из Палдекса", () => {
    expect(pals).toHaveLength(288)
  })

  it("номер Палдекса вместе с суффиксом уникален", () => {
    const keys = pals.map((pal) => `${pal.dexNo}${pal.dexSuffix}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("имя есть на обоих языках и это не заглушка локали", () => {
    for (const pal of pals) {
      expect(pal.name.en.length, pal.id).toBeGreaterThan(0)
      expect(pal.name.ru.length, pal.id).toBeGreaterThan(0)
      expect(/^[a-z]{2}_Text$/i.test(pal.name.ru), pal.id).toBe(false)
    }
  })

  /**
   * Русские имена приезжают джойном по ключу в нижнем регистре: в таблице
   * SheepBall, в дампе Sheepball. Если джойн однажды сделают буквальным,
   * русские имена подменятся английскими — вот это и ловится.
   */
  it("у палов есть отдельные русские имена, а не копии английских", () => {
    const translated = pals.filter((pal) => pal.name.ru !== pal.name.en)
    expect(translated.length).toBe(pals.length)
  })

  it("у каждого пала есть портрет на диске", () => {
    for (const pal of pals) {
      expect(existsSync(join(ROOT, "public/icons/pals", `${pal.id}.webp`)), pal.id).toBe(true)
    }
  })

  it("все тринадцать работ переведены", () => {
    expect(Object.keys(palsFile.workNames)).toHaveLength(WORK_ORDER.length)
    for (const key of WORK_ORDER) {
      expect(palsFile.workNames[key].ru.length, key).toBeGreaterThan(0)
      expect(palsFile.workNames[key].en.length, key).toBeGreaterThan(0)
      expect(palsFile.workNames[key].ru, key).not.toBe(key)
    }
  })

  /**
   * Верхняя граница шкалы в фильтре берётся из данных, а не из головы: в игре
   * базовый максимум четыре, но стихийные варианты доходят до восьми. Число
   * здесь — контрольное: вырастет после патча, тест это покажет.
   */
  it("уровни работ лежат в диапазоне 1..8", () => {
    const levels = pals.flatMap((pal) => Object.values(pal.work))
    expect(Math.min(...levels)).toBe(1)
    expect(Math.max(...levels)).toBe(8)
  })

  it("нулевые уровни в файл не попадают", () => {
    for (const pal of pals) {
      for (const [key, level] of Object.entries(pal.work)) {
        expect(level, `${pal.id}/${key}`).toBeGreaterThan(0)
        expect(WORK_ORDER, `${pal.id}/${key}`).toContain(key)
      }
    }
  })

  /**
   * Стихий у пала одна или две — кроме Astralym: в игровой таблице у него
   * ElementType1 равен None, и работ он тоже не умеет. Это единственное
   * исключение, и оно названо поимённо: появится второе — тест упадёт, а не
   * тихо расширит правило.
   */
  it("стихий одна или две, и ровно один пал без них", () => {
    const without = pals.filter((pal) => pal.elements.length === 0)
    expect(without.map((pal) => pal.id)).toEqual(["WorldTreeDragon"])

    for (const pal of pals) {
      expect(pal.elements.length, pal.id).toBeLessThanOrEqual(2)
    }
  })

  it("версия игры совпадает с константой", () => {
    expect(palsFile.gameVersion).toBe(GAME_VERSION)
  })
})
