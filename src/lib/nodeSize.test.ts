import { describe, expect, it } from "vitest"

import {
  DEFAULT_NODE_SIZE,
  NODE_SIZE_KEYS,
  isNodeSizeKey,
  nodeMetrics,
  nodeVars,
} from "./nodeSize.ts"

describe("ступени размера", () => {
  it("плитка растёт монотонно по ключам", () => {
    const tiles = NODE_SIZE_KEYS.map((key) => nodeMetrics(key).step.tile)
    expect(tiles).toEqual([...tiles].sort((a, b) => a - b))
    expect(new Set(tiles).size).toBe(tiles.length)
  })

  it("умолчание крупнее эталонных 56", () => {
    expect(nodeMetrics(DEFAULT_NODE_SIZE).step.tile).toBeGreaterThan(56)
  })

  it("роли упорядочены: вариант и плотный меньше ступени", () => {
    for (const key of NODE_SIZE_KEYS) {
      const m = nodeMetrics(key)
      expect(m.variant.tile, key).toBeLessThan(m.step.tile)
      expect(m.dense.tile, key).toBeLessThan(m.step.tile)
      expect(m.mini.tile, key).toBeLessThan(m.variant.tile)
    }
  })
})

describe("инвариант шкалы уровней", () => {
  it("шаг всегда шире плитки — иначе узлы наедут друг на друга", () => {
    // Тот же зазор использует packRows: при его нарушении одиночные узлы
    // начнут накладываться, и это не падение, а молча испорченная картинка.
    for (const key of NODE_SIZE_KEYS) {
      const m = nodeMetrics(key)
      expect(m.dense.tile + 8, key).toBeLessThanOrEqual(m.levelStep)
    }
  })

  it("узел занимает ровно один уровень на любой ступени", () => {
    for (const key of NODE_SIZE_KEYS) {
      const m = nodeMetrics(key)
      expect(Math.ceil(m.dense.tile / m.levelStep), key).toBe(1)
    }
  })

  it("ряд с вариантами выше обычного", () => {
    for (const key of NODE_SIZE_KEYS) {
      const m = nodeMetrics(key)
      expect(m.rowHeight(true), key).toBeGreaterThan(m.rowHeight(false))
      expect(m.rowHeight(false), key).toBe(m.rowBase)
    }
  })
})

describe("кегль бейджей", () => {
  it("держится в читаемом диапазоне на всех ступенях", () => {
    for (const key of NODE_SIZE_KEYS) {
      const { text } = nodeMetrics(key).step
      expect(text, key).toBeGreaterThanOrEqual(9)
      expect(text, key).toBeLessThanOrEqual(13)
    }
  })
})

describe("CSS-переменные", () => {
  it("отдают все три величины в пикселях", () => {
    expect(nodeVars(nodeMetrics("l").step)).toEqual({
      "--node": "64px",
      "--node-text": "11px",
      "--node-label": "92px",
    })
  })
})

describe("валидация из хранилища", () => {
  it("принимает только известные ключи", () => {
    for (const key of NODE_SIZE_KEYS) expect(isNodeSizeKey(key)).toBe(true)
  })

  it("мусор отвергается, а не роняет приложение", () => {
    for (const junk of [null, undefined, 64, "64", "huge", {}, [], ""]) {
      expect(isNodeSizeKey(junk), String(junk)).toBe(false)
    }
  })
})
