import { describe, expect, it } from "vitest"

import {
  NO_PAL_FILTERS,
  buffGroupOf,
  filterPals,
  hitRange,
  matchesPal,
  maxFood,
  maxWorkLevel,
  usedWorkKeys,
  workScore,
  type PalFilters,
  type Range,
} from "./pals.ts"
import type { ElementKey, Pal, WorkKey } from "@/types/pal"

function pal(
  id: string,
  work: Partial<Record<WorkKey, number>>,
  over: Partial<Pal> = {},
): Pal {
  return {
    id,
    dexNo: 1,
    dexSuffix: "",
    name: { ru: id, en: id },
    description: { ru: "", en: "" },
    elements: ["Normal"],
    work,
    nocturnal: false,
    food: 1,
    passives: [],
    size: "M",
    transportSpeed: 100,
    ...over,
  }
}

const filters = (over: Partial<PalFilters>): PalFilters => ({ ...NO_PAL_FILTERS, ...over })
const works = (entries: [WorkKey, Range | null][]) => new Map(entries)

describe("жест диапазона", () => {
  it("первый клик выбирает одно значение", () => {
    expect(hitRange(null, 3)).toEqual({ min: 3, max: 3 })
  })

  it("второй клик выше растягивает диапазон вверх", () => {
    expect(hitRange({ min: 3, max: 3 }, 6)).toEqual({ min: 3, max: 6 })
  })

  it("второй клик ниже растягивает диапазон вниз", () => {
    expect(hitRange({ min: 5, max: 5 }, 2)).toEqual({ min: 2, max: 5 })
  })

  it("клик по единственному выбранному значению снимает выбор", () => {
    expect(hitRange({ min: 4, max: 4 }, 4)).toBeNull()
  })

  it("клик по растянутому диапазону начинает новый: иначе его не сузить", () => {
    expect(hitRange({ min: 2, max: 6 }, 4)).toEqual({ min: 4, max: 4 })
  })
})

describe("подбор по работам", () => {
  it("пустой фильтр пропускает всех", () => {
    expect(matchesPal(pal("A", {}), NO_PAL_FILTERS)).toBe(true)
  })

  it("работа без диапазона значит «умеет», уровень любой", () => {
    const f = filters({ works: works([["Mining", null]]) })
    expect(matchesPal(pal("A", { Mining: 1 }), f)).toBe(true)
    expect(matchesPal(pal("B", {}), f)).toBe(false)
  })

  it("диапазон отсекает и снизу, и сверху", () => {
    const f = filters({ works: works([["Mining", { min: 2, max: 4 }]]) })
    expect(matchesPal(pal("Low", { Mining: 1 }), f)).toBe(false)
    expect(matchesPal(pal("Mid", { Mining: 3 }), f)).toBe(true)
    expect(matchesPal(pal("High", { Mining: 6 }), f)).toBe(false)
  })

  /** Главное правило раздела: игрок ищет одного пала на все работы, а не любого из. */
  it("несколько работ складываются по «и», а не по «или»", () => {
    const f = filters({
      works: works([
        ["Mining", { min: 5, max: 8 }],
        ["Deforest", { min: 5, max: 8 }],
      ]),
    })
    expect(matchesPal(pal("Both", { Mining: 5, Deforest: 5 }), f)).toBe(true)
    expect(matchesPal(pal("Half", { Mining: 5 }), f)).toBe(false)
  })
})

describe("подбор по стихиям, еде и усилителям", () => {
  it("стихии складываются по «или»: хватает одной из выбранных", () => {
    const f = filters({ elements: new Set<ElementKey>(["Fire", "Ice"]) })
    expect(matchesPal(pal("A", {}, { elements: ["Ice", "Dragon"] }), f)).toBe(true)
    expect(matchesPal(pal("B", {}, { elements: ["Water"] }), f)).toBe(false)
  })

  it("еда фильтруется диапазоном", () => {
    const f = filters({ food: { min: 1, max: 3 } })
    expect(matchesPal(pal("Cheap", {}, { food: 2 }), f)).toBe(true)
    expect(matchesPal(pal("Hungry", {}, { food: 8 }), f)).toBe(false)
  })

  it("«любой усилитель» не считает чистый штраф усилителем", () => {
    const f = filters({ buffs: new Set(["any" as const]) })
    expect(matchesPal(pal("Buffed", {}, { passives: ["Legend"] }), f)).toBe(true)
    expect(matchesPal(pal("Cursed", {}, { passives: ["PAL_ALLAttack_down1"] }), f)).toBe(false)
    expect(matchesPal(pal("Plain", {}), f)).toBe(false)
  })

  it("группа отбирает только свою пассивку", () => {
    const f = filters({ buffs: new Set(["element" as const]) })
    expect(matchesPal(pal("Emp", {}, { passives: ["ElementBoost_Fire_2_PAL"] }), f)).toBe(true)
    expect(matchesPal(pal("Tank", {}, { passives: ["Deffence_up1"] }), f)).toBe(false)
  })

  it("штрафники находятся своей группой явно", () => {
    const f = filters({ buffs: new Set(["penalty" as const]) })
    expect(matchesPal(pal("Cursed", {}, { passives: ["PAL_FullStomach_Up_1"] }), f)).toBe(true)
    expect(matchesPal(pal("Emp", {}, { passives: ["ElementBoost_Fire_2_PAL"] }), f)).toBe(false)
  })

  it("неизвестная пассивка не имеет группы", () => {
    expect(buffGroupOf("Legend")).toBe("legend")
    expect(buffGroupOf("НетТакой")).toBeNull()
  })
})

describe("избранное", () => {
  it("выключенный фильтр пропускает всех независимо от избранного", () => {
    expect(matchesPal(pal("A", {}), NO_PAL_FILTERS, new Set(["A"]))).toBe(true)
    expect(matchesPal(pal("B", {}), NO_PAL_FILTERS, new Set(["A"]))).toBe(true)
  })

  it("включённый фильтр оставляет только избранных", () => {
    const f = filters({ favoritesOnly: true })
    expect(matchesPal(pal("A", {}), f, new Set(["A"]))).toBe(true)
    expect(matchesPal(pal("B", {}), f, new Set(["A"]))).toBe(false)
  })

  it("складывается с остальными фильтрами по «и»", () => {
    const f = filters({ favoritesOnly: true, works: works([["Mining", null]]) })
    expect(matchesPal(pal("A", { Mining: 2 }), f, new Set(["A"]))).toBe(true)
    expect(matchesPal(pal("B", {}), f, new Set(["B"]))).toBe(false)
  })

  it("filterPals прокидывает избранное в отбор", () => {
    const pals = [pal("A", {}), pal("B", {})]
    const f = filters({ favoritesOnly: true })
    expect(filterPals(pals, f, "", "ru", new Set(["B"])).map((p) => p.id)).toEqual(["B"])
  })
})

describe("порядок выдачи", () => {
  it("при выбранных работах сильнейший идёт первым", () => {
    const weak = pal("Weak", { Mining: 3 })
    const strong = pal("Strong", { Mining: 5 })
    const f = filters({ works: works([["Mining", null]]) })
    expect(filterPals([weak, strong], f, "", "ru").map((p) => p.id)).toEqual(["Strong", "Weak"])
  })

  it("сумма считается только по выбранным работам", () => {
    const p = pal("P", { Mining: 5, Deforest: 3, Cool: 9 })
    expect(workScore(p, works([["Mining", null]]))).toBe(5)
    expect(
      workScore(
        p,
        works([
          ["Mining", null],
          ["Deforest", null],
        ]),
      ),
    ).toBe(8)
  })

  it("без фильтра порядок исходный", () => {
    const first = pal("First", { Mining: 1 })
    const second = pal("Second", { Mining: 9 })
    expect(filterPals([first, second], NO_PAL_FILTERS, "", "ru").map((p) => p.id)).toEqual([
      "First",
      "Second",
    ])
  })
})

describe("поиск по имени", () => {
  const lamball = pal("SheepBall", { Handcraft: 1 }, { name: { ru: "Ламболл", en: "Lamball" } })
  const cattiva = pal("PinkCat", { Mining: 1 }, { name: { ru: "Каттива", en: "Cattiva" } })

  it("находит по русскому и по английскому имени", () => {
    expect(filterPals([lamball, cattiva], NO_PAL_FILTERS, "ламб", "ru")).toHaveLength(1)
    expect(filterPals([lamball, cattiva], NO_PAL_FILTERS, "lamb", "ru")).toHaveLength(1)
  })

  it("поиск и фильтры применяются вместе", () => {
    const f = filters({ works: works([["Mining", null]]) })
    expect(filterPals([lamball, cattiva], f, "катт", "ru").map((p) => p.id)).toEqual(["PinkCat"])
  })
})

describe("границы из данных", () => {
  it("максимальный уровень работы — из данных, а не из предположения", () => {
    expect(maxWorkLevel([pal("A", { Mining: 4 }), pal("B", { Cool: 8 })])).toBe(8)
  })

  it("максимальная еда — тоже из данных", () => {
    expect(maxFood([pal("A", {}, { food: 3 }), pal("B", {}, { food: 9 })])).toBe(9)
  })

  it("на пустых данных не падает", () => {
    expect(maxWorkLevel([])).toBe(0)
    expect(maxFood([])).toBe(0)
  })
})

describe("используемые работы", () => {
  it("возвращает только те работы, которыми кто-то владеет, в игровом порядке", () => {
    const list = [pal("A", { MonsterFarm: 1 }), pal("B", { EmitFlame: 1 })]
    expect(usedWorkKeys(list)).toEqual(["EmitFlame", "MonsterFarm"])
  })

  it("на пустых данных пусто", () => {
    expect(usedWorkKeys([])).toEqual([])
  })
})

describe("на настоящих данных", () => {
  /**
   * Группы усилителей — явная карта. Она обязана покрывать каждую пассивку из
   * данных: новая после патча уронит этот тест и будет классифицирована
   * осознанно, а не потеряется из фильтра молча.
   */
  it("каждая пассивка из данных отнесена к группе усилителей", async () => {
    const { BUFF_GROUP_OF } = await import("./pals.ts")
    const file = (await import("@/data/pals.json")).default as unknown as {
      pals: { passives: string[] }[]
    }
    const used = new Set(file.pals.flatMap((pal) => pal.passives))
    expect(used.size).toBeGreaterThan(0)
    for (const id of used) {
      expect(BUFF_GROUP_OF[id], id).toBeDefined()
    }
  })
})
