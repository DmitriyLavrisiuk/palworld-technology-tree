import { describe, expect, it } from "vitest"

import { combineResources, dropYield, filterResources, sortedSources } from "./drops.ts"
import type { DropResource, DropSource } from "@/types/drop"
import type { RanchFile } from "@/types/ranch"

const source = (palId: string, min: number, max: number, rate = 100): DropSource => ({
  palId,
  min,
  max,
  rate,
})

const resource = (id: string, ru: string, en: string): DropResource => ({
  id,
  name: { ru, en },
  sources: [],
})

describe("порядок источников", () => {
  it("выход считается серединой диапазона, взвешенной шансом", () => {
    expect(dropYield(source("A", 2, 4))).toBe(3)
    expect(dropYield(source("A", 2, 4, 50))).toBe(1.5)
  })

  it("лучший добытчик первым", () => {
    const list = [source("Weak", 1, 1), source("Strong", 5, 10)]
    expect(sortedSources(list).map((s) => s.palId)).toEqual(["Strong", "Weak"])
  })

  it("шанс входит в выход: «5–5 при 50%» хуже «3–3 при 100%»", () => {
    const list = [source("Gambler", 5, 5, 50), source("Steady", 3, 3)]
    expect(sortedSources(list).map((s) => s.palId)).toEqual(["Steady", "Gambler"])
  })

  it("при равном выходе надёжный выше", () => {
    const list = [source("Gambler", 2, 2, 50), source("Steady", 1, 1)]
    expect(sortedSources(list).map((s) => s.palId)).toEqual(["Steady", "Gambler"])
  })

  it("исходный массив не мутируется", () => {
    const list = [source("B", 1, 1), source("A", 5, 5)]
    sortedSources(list)
    expect(list[0].palId).toBe("B")
  })
})

describe("поиск ресурсов", () => {
  const list = [
    resource("Wool", "Шерсть", "Wool"),
    resource("Bone", "Кость", "Bone"),
    resource("FireOrgan", "Огненный орган", "Flame Organ"),
  ]

  it("пустой запрос отдаёт всех по алфавиту локали", () => {
    expect(filterResources(list, "", "ru").map((r) => r.id)).toEqual([
      "Bone",
      "FireOrgan",
      "Wool",
    ])
  })

  it("ищет по обоим языкам сразу", () => {
    expect(filterResources(list, "шерсть", "ru").map((r) => r.id)).toEqual(["Wool"])
    expect(filterResources(list, "flame", "ru").map((r) => r.id)).toEqual(["FireOrgan"])
  })
})

describe("слияние дропа и фермы", () => {
  const product = (itemId: string) => ({
    itemId,
    unlockLevel: 1,
    min: 1,
    max: 1,
    min10: 3,
    max10: 10,
    rate: 100,
  })
  const ranch: RanchFile = {
    gameVersion: "x",
    generatedAt: "x",
    items: { Sweet: { name: { ru: "Сахарная вата", en: "Cotton Candy" } } },
    producers: [
      { palId: "SheepBall", products: [product("Wool")] },
      { palId: "SweetsSheep", products: [product("Sweet")] },
    ],
  }

  it("фермеры пристыковываются к ресурсу дропа", () => {
    const merged = combineResources([resource("Wool", "Шерсть", "Wool")], ranch)
    const wool = merged.find((entry) => entry.id === "Wool")
    expect(wool?.farm.map((source) => source.palId)).toEqual(["SheepBall"])
  })

  it("ресурс только с фермы появляется в списке с именем из ranch", () => {
    const merged = combineResources([], ranch)
    const sweet = merged.find((entry) => entry.id === "Sweet")
    expect(sweet?.name.ru).toBe("Сахарная вата")
    expect(sweet?.sources).toEqual([])
    expect(sweet?.farm).toHaveLength(1)
  })

  it("ресурс без фермеров получает пустой список фермы", () => {
    const merged = combineResources([resource("Bone", "Кость", "Bone")], ranch)
    expect(merged.find((entry) => entry.id === "Bone")?.farm).toEqual([])
  })
})
