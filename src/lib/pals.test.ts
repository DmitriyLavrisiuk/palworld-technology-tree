import { describe, expect, it } from "vitest"

import { filterPals, matchesWork, maxWorkLevel, usedWorkKeys, workScore } from "./pals.ts"
import type { Pal, WorkKey } from "@/types/pal"

function pal(id: string, work: Partial<Record<WorkKey, number>>, ru = id, en = id): Pal {
  return {
    id,
    dexNo: 1,
    dexSuffix: "",
    name: { ru, en },
    elements: ["Normal"],
    work,
    nocturnal: false,
    size: "M",
    transportSpeed: 100,
  }
}

const need = (entries: [WorkKey, number][]) => new Map(entries)

describe("подбор по работам", () => {
  it("пустое требование пропускает всех", () => {
    expect(matchesWork(pal("A", {}), need([]))).toBe(true)
    expect(matchesWork(pal("B", { Mining: 3 }), need([]))).toBe(true)
  })

  it("требование — это «не ниже», а не «ровно»", () => {
    const digger = pal("Digger", { Mining: 5 })
    expect(matchesWork(digger, need([["Mining", 3]]))).toBe(true)
    expect(matchesWork(digger, need([["Mining", 5]]))).toBe(true)
    expect(matchesWork(digger, need([["Mining", 6]]))).toBe(false)
  })

  it("уровень ниже требуемого не проходит", () => {
    expect(matchesWork(pal("Weak", { Mining: 4 }), need([["Mining", 5]]))).toBe(false)
  })

  /** Главное правило раздела: игрок ищет одного пала на все работы, а не любого из. */
  it("несколько работ складываются по «и», а не по «или»", () => {
    const both = pal("Both", { Mining: 5, Deforest: 5 })
    const onlyMining = pal("Half", { Mining: 5 })
    const required = need([
      ["Mining", 5],
      ["Deforest", 5],
    ])

    expect(matchesWork(both, required)).toBe(true)
    expect(matchesWork(onlyMining, required)).toBe(false)
  })

  it("отсутствующая работа считается нулём, а не ошибкой", () => {
    expect(matchesWork(pal("None", {}), need([["Cool", 1]]))).toBe(false)
  })
})

describe("порядок выдачи", () => {
  it("сумма считается только по выбранным работам", () => {
    const p = pal("P", { Mining: 5, Deforest: 3, Cool: 9 })
    expect(workScore(p, need([["Mining", 1]]))).toBe(5)
    expect(
      workScore(
        p,
        need([
          ["Mining", 1],
          ["Deforest", 1],
        ]),
      ),
    ).toBe(8)
  })

  it("при активном фильтре сильнейший идёт первым", () => {
    const weak = pal("Weak", { Mining: 3 }, "Слабый", "Weak")
    const strong = pal("Strong", { Mining: 5 }, "Сильный", "Strong")

    const found = filterPals([weak, strong], need([["Mining", 1]]), "", "ru")
    expect(found.map((item) => item.id)).toEqual(["Strong", "Weak"])
  })

  it("без фильтра порядок исходный, а не пересортированный", () => {
    const first = pal("First", { Mining: 1 })
    const second = pal("Second", { Mining: 9 })

    const found = filterPals([first, second], need([]), "", "ru")
    expect(found.map((item) => item.id)).toEqual(["First", "Second"])
  })
})

describe("поиск по имени", () => {
  const lamball = pal("SheepBall", { Handcraft: 1 }, "Ламболл", "Lamball")
  const cattiva = pal("PinkCat", { Mining: 1 }, "Каттива", "Cattiva")

  it("находит по русскому и по английскому имени", () => {
    expect(filterPals([lamball, cattiva], need([]), "ламб", "ru")).toHaveLength(1)
    expect(filterPals([lamball, cattiva], need([]), "lamb", "ru")).toHaveLength(1)
  })

  it("поиск и фильтр работ применяются вместе", () => {
    const found = filterPals([lamball, cattiva], need([["Mining", 1]]), "катт", "ru")
    expect(found.map((item) => item.id)).toEqual(["PinkCat"])
  })

  it("пустой запрос никого не отсекает", () => {
    expect(filterPals([lamball, cattiva], need([]), "", "ru")).toHaveLength(2)
  })
})

describe("верхняя граница уровня", () => {
  it("берётся из данных, а не из предположения", () => {
    expect(maxWorkLevel([pal("A", { Mining: 4 }), pal("B", { Cool: 8 })])).toBe(8)
  })

  it("на пустых данных не падает", () => {
    expect(maxWorkLevel([])).toBe(0)
    expect(maxWorkLevel([pal("A", {})])).toBe(0)
  })
})

describe("используемые работы", () => {
  it("возвращает только те работы, которыми кто-то владеет", () => {
    const pals = [pal("A", { Mining: 3 }), pal("B", { Cool: 1, Mining: 5 })]
    expect(usedWorkKeys(pals)).toEqual(["Mining", "Cool"])
  })

  it("порядок игровой, а не порядок встречи", () => {
    const pals = [pal("A", { MonsterFarm: 1 }), pal("B", { EmitFlame: 1 })]
    expect(usedWorkKeys(pals)).toEqual(["EmitFlame", "MonsterFarm"])
  })

  it("на пустых данных пусто", () => {
    expect(usedWorkKeys([])).toEqual([])
  })
})
