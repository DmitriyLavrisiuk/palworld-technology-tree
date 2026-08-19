import { describe, expect, it } from "vitest"

import { buildChains } from "./build-chains.ts"
import type { Technology } from "../src/types/tech.ts"

/**
 * Цепочки почти целиком синтезированы, поэтому проверяется не «что получилось»,
 * а правила: порядок авторитета и защиты от ложных склеек. Логика — CHAINS.md.
 */

function tech(id: string, nameEn: string, over: Partial<Technology> = {}): Technology {
  return {
    id,
    name: { en: nameEn, ru: nameEn },
    description: { en: "", ru: "" },
    level: 1,
    cost: 1,
    ancient: false,
    category: "Items",
    group: "material",
    iconName: id,
    reqTech: null,
    reqBoss: null,
    reqResearch: null,
    unlockBuild: [],
    unlockItems: [id],
    ...over,
  }
}

describe("порядок авторитета", () => {
  it("ручная семья получает метку manual", () => {
    const techs = [tech("A_Grade_01", "Iron Blade"), tech("B_Grade_02", "Steel Blade")]
    const result = buildChains(techs, {
      chains: [{ id: "blades", members: ["A_Grade_01", "B_Grade_02"] }],
    })

    expect(result.chains).toHaveLength(1)
    expect(result.chains[0].confidence).toBe("manual")
    expect(result.chains[0].members).toEqual(["A_Grade_01", "B_Grade_02"])
  })

  it("ручная семья забирает узлы раньше эвристики", () => {
    const techs = [
      tech("Blade_Grade_01", "Iron Blade"),
      tech("Blade_Grade_02", "Steel Blade"),
    ]
    const heuristic = buildChains(techs, { chains: [] })
    expect(heuristic.chains[0].confidence).toBe("stem")

    const manual = buildChains(techs, {
      chains: [{ id: "blades", members: ["Blade_Grade_01", "Blade_Grade_02"] }],
    })
    expect(manual.chains).toHaveLength(1)
    expect(manual.chains[0].confidence).toBe("manual")
  })

  it("связь из игры получает метку hard", () => {
    const techs = [
      tech("Ancient_Base", "Ancient Table"),
      tech("Ancient_Next", "Ancient Bench", { reqTech: "Ancient_Base", level: 2 }),
    ]
    const result = buildChains(techs, { chains: [] })

    expect(result.chains).toHaveLength(1)
    expect(result.chains[0].confidence).toBe("hard")
    expect(result.chains[0].members).toEqual(["Ancient_Base", "Ancient_Next"])
  })
})

describe("защиты от ложных склеек", () => {
  it("общий токен id без общего хвоста названия не склеивается", () => {
    const techs = [
      tech("Wooden_widget", "Wooden Hammer"),
      tech("Stone_widget", "Stone Anvil"),
    ]
    expect(buildChains(techs, { chains: [] }).chains).toEqual([])
  })

  it("общий токен id с общим хвостом названия склеивается", () => {
    const techs = [
      tech("Wooden_houseset", "Wooden Structure Set"),
      tech("Stone_houseset", "Stone Structure Set", { level: 2 }),
    ]
    const result = buildChains(techs, { chains: [] })

    expect(result.chains).toHaveLength(1)
    expect(result.chains[0].confidence).toBe("stem")
    expect(result.chains[0].name.en).toBe("Structure Set")
  })

  it("неоднозначные существительные не группируются по названию", () => {
    const techs = [tech("Qq", "Red Sphere"), tech("Ww", "Blue Sphere")]
    expect(buildChains(techs, { chains: [] }).chains).toEqual([])
  })

  it("семья больше восьми по названию отбрасывается как ложная", () => {
    // Однословные буквенные id: и стем, и хвост id дают пустой ключ, поэтому
    // сработать может только проход по названию — именно у него потолок в 8.
    const names = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India"]
    const many = names.map((id, index) => tech(id, `Colour${index} Widget`))
    expect(buildChains(many, { chains: [] }).chains).toEqual([])

    const few = many.slice(0, 5)
    const result = buildChains(few, { chains: [] })
    expect(result.chains).toHaveLength(1)
    expect(result.chains[0].confidence).toBe("name")
  })
})

describe("варианты и корзины", () => {
  it("климатический вариант не удлиняет цепочку, а уезжает в variants", () => {
    const techs = [
      tech("Armor_Grade_01", "Iron Armor"),
      tech("Armor_Grade_02", "Steel Armor", { level: 2 }),
      tech("Armor_Grade_01_Heat", "Iron Armor Heat"),
    ]
    const result = buildChains(techs, { chains: [] })

    expect(result.chains).toHaveLength(1)
    expect(result.chains[0].members).toEqual(["Armor_Grade_01", "Armor_Grade_02"])
    expect(result.chains[0].variants?.Armor_Grade_01).toEqual(["Armor_Grade_01_Heat"])
    expect(result.stats.variants).toBe(1)
  })

  it("массовые наборы уходят в корзины до всякой кластеризации", () => {
    const techs = [
      tech("SkillUnlock_Alpaca", "Alpaca Saddle"),
      tech("SkillUnlock_Boar", "Boar Saddle", { level: 2 }),
      tech("FurnitureSet_1", "Furniture Set 1"),
      tech("FurnitureSet_2", "Furniture Set 2", { level: 2 }),
    ]
    const result = buildChains(techs, { chains: [] })

    expect(result.chains).toEqual([])
    expect(result.buckets.map((bucket) => bucket.id).sort()).toEqual(["furniture", "saddles"])
    expect(result.stats.bucketed).toBe(4)
  })
})

describe("exclude", () => {
  it("запрещённый id не попадает в цепочку, но остаётся в дереве одиночкой", () => {
    const techs = [
      tech("Blade_Grade_01", "Iron Blade"),
      tech("Blade_Grade_02", "Steel Blade", { level: 2 }),
      tech("Blade_Grade_03", "Gold Blade", { level: 3 }),
    ]
    const result = buildChains(techs, { chains: [], exclude: ["Blade_Grade_03"] })

    expect(result.chains[0].members).toEqual(["Blade_Grade_01", "Blade_Grade_02"])
    expect(result.loose.flatMap((entry) => entry.members)).toEqual(["Blade_Grade_03"])
  })
})

describe("порядок и статистика", () => {
  it("члены сортируются по уровню независимо от порядка на входе", () => {
    const techs = [
      tech("Bow_Grade_03", "Gold Bow", { level: 30 }),
      tech("Bow_Grade_01", "Iron Bow", { level: 10 }),
      tech("Bow_Grade_02", "Steel Bow", { level: 20 }),
    ]
    const result = buildChains(techs, { chains: [] })
    expect(result.chains[0].members).toEqual(["Bow_Grade_01", "Bow_Grade_02", "Bow_Grade_03"])
  })

  it("статистика раскладывает все узлы без потерь, включая варианты", () => {
    // Вариант в фикстуре обязателен: без него разбиение сходилось бы даже
    // при потерянных вариантах — ровно так проверка и была слепой.
    const techs = [
      tech("Blade_Grade_01", "Iron Blade"),
      tech("Blade_Grade_02", "Steel Blade", { level: 2 }),
      tech("Blade_Grade_01_Heat", "Iron Blade Heat"),
      tech("SkillUnlock_Alpaca", "Alpaca Saddle"),
      tech("Lonely_Thing", "Something Else"),
    ]
    const { stats } = buildChains(techs, { chains: [] })

    expect(stats.total).toBe(5)
    expect(stats.variants).toBe(1)
    expect(stats.inChains + stats.bucketed + stats.ungrouped).toBe(stats.total)
  })

  it("узлы по достоверности в сумме дают inChains", () => {
    const techs = [
      tech("Blade_Grade_01", "Iron Blade"),
      tech("Blade_Grade_02", "Steel Blade", { level: 2 }),
      tech("Blade_Grade_01_Heat", "Iron Blade Heat"),
    ]
    const { stats } = buildChains(techs, { chains: [] })

    const total = Object.values(stats.byConfidence).reduce((sum, n) => sum + n, 0)
    expect(total).toBe(stats.inChains)
    expect(stats.inChains).toBe(3)
  })

  it("апостроф остаётся частью слова в имени цепочки", () => {
    const techs = [
      tech("Spear_Boss", "Lily's Spear"),
      tech("Spear_Boss2", "Enhanced Lily's Spear", { level: 2 }),
    ]
    const result = buildChains(techs, { chains: [] })
    expect(result.chains[0].name.en).toBe("Lily's Spear")
  })
})
