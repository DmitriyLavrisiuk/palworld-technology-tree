import { describe, expect, it } from "vitest"

import { iconUrl, loadTechData } from "./data.ts"

/**
 * Индексы — результат Фазы 2, на который опирается вся отрисовка Фазы 3.
 * Отдельно сторожится BASE_URL: по правилу из CLAUDE.md путь от корня
 * работает на дев-сервере и молча ломается на GitHub Pages.
 */

describe("iconUrl", () => {
  it("идёт через BASE_URL, а не от корня сайта", () => {
    const url = iconUrl("Special_PalSphere_Grade_01")
    expect(url.startsWith(import.meta.env.BASE_URL)).toBe(true)
    expect(url).not.toMatch(/^\/icons\//)
    expect(url.endsWith("icons/Special_PalSphere_Grade_01.webp")).toBe(true)
  })

  it("не порождает двойной слэш на стыке с базой", () => {
    expect(iconUrl("Anything")).not.toMatch(/[^:]\/\//)
  })
})

describe("индексы", () => {
  it("byId и recipes покрывают загруженные данные", async () => {
    const data = await loadTechData()
    expect(data.byId.size).toBe(data.technologies.length)
    for (const techId of data.recipes.keys()) {
      expect(data.byId.has(techId), techId).toBe(true)
    }
  })

  it("chainOf и indexInChain согласованы с членами цепочек", async () => {
    const data = await loadTechData()
    for (const chain of data.chains.chains) {
      chain.members.forEach((id, index) => {
        expect(data.chainOf.get(id)?.id, id).toBe(chain.id)
        expect(data.indexInChain.get(id), id).toBe(index)
      })
    }
  })

  it("вариант помечен позицией -1 и знает свой базовый узел", async () => {
    const data = await loadTechData()
    const variants = data.chains.chains.flatMap((chain) =>
      Object.entries(chain.variants ?? {}).flatMap(([base, list]) =>
        list.map((id) => ({ id, base, chainId: chain.id })),
      ),
    )
    expect(variants.length).toBeGreaterThan(0)

    for (const variant of variants) {
      expect(data.indexInChain.get(variant.id), variant.id).toBe(-1)
      expect(data.variantOf.get(variant.id), variant.id).toBe(variant.base)
      expect(data.chainOf.get(variant.id)?.id, variant.id).toBe(variant.chainId)
    }
  })
})
