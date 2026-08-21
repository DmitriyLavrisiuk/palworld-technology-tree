import { describe, expect, it } from "vitest"

import { dropYield, filterResources, sortedSources } from "./drops.ts"
import type { DropResource, DropSource } from "@/types/drop"

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
