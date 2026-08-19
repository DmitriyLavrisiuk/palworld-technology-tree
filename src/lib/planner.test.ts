import { describe, expect, it } from "vitest"

import { loadTechData, type TechData } from "@/lib/data"
import { buildRoute } from "./planner.ts"
import type { Chain, ChainsFile, Recipe, Technology } from "@/types/tech"

function tech(id: string, over: Partial<Technology> = {}): Technology {
  return {
    id,
    name: { en: id, ru: id },
    description: { en: "", ru: "" },
    level: 1,
    cost: 1,
    ancient: false,
    category: "Items",
    iconName: id,
    reqTech: null,
    reqBoss: null,
    reqResearch: null,
    unlockBuild: [],
    unlockItems: [id],
    ...over,
  }
}

/** Собирает индексы ровно так же, как loadTechData, но без сети и файлов. */
function makeData(
  technologies: Technology[],
  chains: Chain[] = [],
  recipes: Recipe[] = [],
): TechData {
  const file: ChainsFile = {
    gameVersion: "test",
    generatedAt: "2026-08-19",
    chains,
    buckets: [],
    loose: [],
  }
  const chainOf = new Map<string, Chain>()
  const indexInChain = new Map<string, number>()
  const variantOf = new Map<string, string>()

  for (const chain of chains) {
    chain.members.forEach((id, index) => {
      chainOf.set(id, chain)
      indexInChain.set(id, index)
    })
    for (const [base, list] of Object.entries(chain.variants ?? {})) {
      for (const id of list) {
        chainOf.set(id, chain)
        indexInChain.set(id, -1)
        variantOf.set(id, base)
      }
    }
  }

  return {
    technologies,
    chains: file,
    byId: new Map(technologies.map((item) => [item.id, item])),
    recipes: new Map(recipes.map((item) => [item.techId, item])),
    chainOf,
    indexInChain,
    variantOf,
  }
}

function chain(id: string, members: string[], over: Partial<Chain> = {}): Chain {
  return {
    id,
    group: "gear",
    name: { en: id, ru: id },
    kind: "chain",
    confidence: "manual",
    members,
    ...over,
  }
}

describe("предшественники", () => {
  it("цепочка ступеней даёт всё, что стоит раньше цели", () => {
    const techs = [
      tech("T1", { level: 1 }),
      tech("T2", { level: 10 }),
      tech("T3", { level: 20 }),
      tech("T4", { level: 30 }),
    ]
    const route = buildRoute("T3", makeData(techs, [chain("c", ["T1", "T2", "T3", "T4"])]), new Set())

    expect(route?.steps.map((step) => step.tech.id)).toEqual(["T1", "T2", "T3"])
    expect(route?.steps.map((step) => step.source)).toEqual(["chain", "chain", "target"])
  })

  it("параллельные варианты пререквизитами не становятся", () => {
    // Семь культур и пять модулей сфер — не ступени. Требовать ягодную
    // плантацию ради пшеничной значит выдумать порядок, которого нет.
    const techs = [tech("Berry"), tech("Wheat", { level: 5 }), tech("Onion", { level: 9 })]
    const group = chain("crops", ["Berry", "Wheat", "Onion"], { kind: "group" })
    const route = buildRoute("Onion", makeData(techs, [group]), new Set())

    expect(route?.steps.map((step) => step.tech.id)).toEqual(["Onion"])
    expect(route?.synthesisedSteps).toBe(0)
  })

  it("настоящее ребро игры разворачивается транзитивно и вне цепочки", () => {
    const techs = [
      tech("Root", { level: 5 }),
      tech("Middle", { level: 10, reqTech: "Root" }),
      tech("Leaf", { level: 15, reqTech: "Middle" }),
    ]
    const route = buildRoute("Leaf", makeData(techs), new Set())

    expect(route?.steps.map((step) => step.tech.id)).toEqual(["Root", "Middle", "Leaf"])
    expect(route?.steps.map((step) => step.source)).toEqual(["game", "game", "target"])
    expect(route?.synthesisedSteps).toBe(0)
  })

  it("вариант требует свою базовую ступень, а не предыдущую", () => {
    const techs = [
      tech("Armor_01", { level: 5 }),
      tech("Armor_02", { level: 15 }),
      tech("Armor_02_Heat", { level: 15 }),
    ]
    const withVariants = chain("armor", ["Armor_01", "Armor_02"], {
      variants: { Armor_02: ["Armor_02_Heat"] },
    })
    const route = buildRoute("Armor_02_Heat", makeData(techs, [withVariants]), new Set())

    expect(route?.steps.map((step) => step.tech.id)).toEqual([
      "Armor_01",
      "Armor_02",
      "Armor_02_Heat",
    ])
  })

  it("цикл в данных не подвешивает построение", () => {
    const techs = [
      tech("A", { reqTech: "B" }),
      tech("B", { reqTech: "A" }),
    ]
    const route = buildRoute("A", makeData(techs), new Set())
    expect(route?.steps.map((step) => step.tech.id).sort()).toEqual(["A", "B"])
  })

  it("несуществующая цель даёт null", () => {
    expect(buildRoute("Nope", makeData([tech("A")]), new Set())).toBeNull()
  })
})

describe("суммы", () => {
  const techs = [
    tech("T1", { level: 5, cost: 2 }),
    tech("T2", { level: 10, cost: 3 }),
    tech("T3", { level: 20, cost: 4, ancient: true }),
  ]
  const line = [chain("c", ["T1", "T2", "T3"])]

  it("очки обычные и древние считаются раздельно", () => {
    const route = buildRoute("T3", makeData(techs, line), new Set())
    expect(route?.techPoints).toBe(5)
    expect(route?.ancientPoints).toBe(4)
  })

  it("изученные шаги в суммы не входят", () => {
    const route = buildRoute("T3", makeData(techs, line), new Set(["T1"]))
    expect(route?.techPoints).toBe(3)
    expect(route?.ancientPoints).toBe(4)
    expect(route?.steps).toHaveLength(3)
    expect(route?.steps[0].researched).toBe(true)
  })

  it("требуемый уровень — максимум среди оставшихся", () => {
    expect(buildRoute("T3", makeData(techs, line), new Set())?.requiredLevel).toBe(20)
    expect(buildRoute("T2", makeData(techs, line), new Set())?.requiredLevel).toBe(10)
  })

  it("когда всё изучено, идти некуда", () => {
    const route = buildRoute("T3", makeData(techs, line), new Set(["T1", "T2", "T3"]))
    expect(route?.requiredLevel).toBeNull()
    expect(route?.techPoints).toBe(0)
    expect(route?.ancientPoints).toBe(0)
    expect(route?.materials).toEqual([])
  })
})

describe("материалы", () => {
  it("складываются по всем неизученным шагам", () => {
    const techs = [tech("T1", { level: 1 }), tech("T2", { level: 5 })]
    const recipes: Recipe[] = [
      {
        techId: "T1",
        stations: [],
        materials: [{ id: "wood", name: { en: "Wood", ru: "Дерево" }, count: 5 }],
      },
      {
        techId: "T2",
        stations: [],
        materials: [
          { id: "wood", name: { en: "Wood", ru: "Дерево" }, count: 3 },
          { id: "stone", name: { en: "Stone", ru: "Камень" }, count: 10 },
        ],
      },
    ]
    const route = buildRoute("T2", makeData(techs, [chain("c", ["T1", "T2"])], recipes), new Set())

    expect(route?.materials).toEqual([
      { id: "stone", name: { en: "Stone", ru: "Камень" }, count: 10 },
      { id: "wood", name: { en: "Wood", ru: "Дерево" }, count: 8 },
    ])
  })

  it("изученный шаг свои материалы больше не требует", () => {
    const techs = [tech("T1"), tech("T2", { level: 5 })]
    const recipes: Recipe[] = [
      {
        techId: "T1",
        stations: [],
        materials: [{ id: "wood", name: { en: "Wood", ru: "Дерево" }, count: 5 }],
      },
    ]
    const data = makeData(techs, [chain("c", ["T1", "T2"])], recipes)
    expect(buildRoute("T2", data, new Set(["T1"]))?.materials).toEqual([])
  })
})

describe("блокеры", () => {
  it("гейты по боссу и лаборатории идут отдельно, а не в стоимость", () => {
    const techs = [
      tech("Gate", { level: 10, cost: 3, reqBoss: "Zoe", reqResearch: null }),
      tech("Target", { level: 12, cost: 2, reqTech: "Gate" }),
    ]
    const route = buildRoute("Target", makeData(techs), new Set())

    expect(route?.techPoints).toBe(5)
    expect(route?.blockers).toHaveLength(1)
    expect(route?.blockers[0].tech.id).toBe("Gate")
    expect(route?.blockers[0].boss).toBe("Zoe")
    expect(route?.blockers[0].research).toBeNull()
  })

  it("изученный шаг блокером уже не считается", () => {
    const techs = [tech("Gate", { reqResearch: "Lab" }), tech("Target", { level: 5, reqTech: "Gate" })]
    const route = buildRoute("Target", makeData(techs), new Set(["Gate"]))
    expect(route?.blockers).toEqual([])
  })
})

describe("достоверность маршрута", () => {
  it("считается, сколько шагов достроено нами, а не взято из игры", () => {
    const techs = [
      tech("S1", { level: 1 }),
      tech("S2", { level: 5 }),
      tech("Real", { level: 8 }),
      tech("Target", { level: 10, reqTech: "Real" }),
    ]
    const withTarget = chain("c", ["S1", "S2", "Target"])
    const route = buildRoute("Target", makeData(techs, [withTarget]), new Set())

    expect(route?.synthesisedSteps).toBe(2)
    expect(route?.steps.filter((step) => step.source === "game").map((s) => s.tech.id)).toEqual([
      "Real",
    ])
  })
})

describe("на настоящих данных", () => {
  it("маршрут до легендарной сферы содержит все предыдущие ступени, суммы сходятся", async () => {
    const data = await loadTechData()
    const targetId = "Special_PalSphere_Grade_07"
    const route = buildRoute(targetId, data, new Set())

    expect(route).not.toBeNull()
    const ids = route!.steps.map((step) => step.tech.id)

    // Все семь ступеней семейства, по возрастанию уровня.
    for (let grade = 1; grade <= 7; grade++) {
      expect(ids, `ступень ${grade}`).toContain(`Special_PalSphere_Grade_0${grade}`)
    }
    const levels = route!.steps.map((step) => step.tech.level)
    expect([...levels].sort((a, b) => a - b)).toEqual(levels)

    // Ручной подсчёт: суммы по тем же шагам, посчитанные независимо.
    const expectedTech = route!.steps
      .filter((step) => !step.tech.ancient)
      .reduce((sum, step) => sum + step.tech.cost, 0)
    const expectedAncient = route!.steps
      .filter((step) => step.tech.ancient)
      .reduce((sum, step) => sum + step.tech.cost, 0)

    expect(route!.techPoints).toBe(expectedTech)
    expect(route!.ancientPoints).toBe(expectedAncient)
    expect(route!.requiredLevel).toBe(Math.max(...levels))
  })

  it("отметка изученного уменьшает стоимость ровно на цену шага", async () => {
    const data = await loadTechData()
    const targetId = "Special_PalSphere_Grade_07"
    const full = buildRoute(targetId, data, new Set())!
    const first = full.steps[0].tech

    const partial = buildRoute(targetId, data, new Set([first.id]))!
    const field = first.ancient ? "ancientPoints" : "techPoints"
    expect(full[field] - partial[field]).toBe(first.cost)
    expect(partial.steps).toHaveLength(full.steps.length)
  })

  it("цель с гейтом по боссу показывает блокер, а не лишние очки", async () => {
    const data = await loadTechData()
    const gated = data.technologies.find((tech) => tech.reqBoss)!
    const route = buildRoute(gated.id, data, new Set())!

    expect(route.blockers.some((blocker) => blocker.tech.id === gated.id)).toBe(true)
    expect(route.blockers[0].boss ?? route.blockers[0].research).toBeTruthy()
  })

  it("маршрут ни до одной технологии не разрастается неправдоподобно", async () => {
    const data = await loadTechData()
    let worst = { id: "", steps: 0 }
    for (const tech of data.technologies) {
      const route = buildRoute(tech.id, data, new Set())!
      if (route.steps.length > worst.steps) worst = { id: tech.id, steps: route.steps.length }
      // Шаги уникальны: узел не может попасть в маршрут дважды.
      const ids = route.steps.map((step) => step.tech.id)
      expect(new Set(ids).size, tech.id).toBe(ids.length)
    }
    // Самая длинная цепочка в данных — 8 членов; с транзитивными рёбрами запас.
    expect(worst.steps, `самый длинный маршрут: ${worst.id}`).toBeLessThanOrEqual(12)
  })
})
