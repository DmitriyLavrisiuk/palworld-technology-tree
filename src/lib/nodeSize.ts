import { GRID } from "@/lib/constants"

/**
 * Единственный источник размеров плитки. До этого модуля размер жил
 * независимо в дюжине мест — шесть разных литералов, которые давно
 * разъехались между режимами.
 *
 * Числа нужны и в CSS, и в JS: раскладка «Шкалы уровней» считает
 * абсолютные координаты, а `packRows` — сколько уровней занимает узел.
 * Поэтому здесь арифметика, а наружу отдаются и числа, и CSS-переменные.
 */

export type NodeSizeKey = "s" | "m" | "l" | "xl" | "xxl"

export const NODE_SIZE_KEYS: NodeSizeKey[] = ["s", "m", "l", "xl", "xxl"]

/** Чуть крупнее эталонных 56: так просил владелец. */
export const DEFAULT_NODE_SIZE: NodeSizeKey = "l"

const TILE: Record<NodeSizeKey, number> = { s: 48, m: 56, l: 64, xl: 80, xxl: 96 }

export interface NodeRole {
  /** Сторона плитки в пикселях. */
  tile: number
  /** Кегль, от которого в `em` считаются все угловые бейджи. */
  text: number
  /** Ширина кнопки вместе с подписью под плиткой. */
  labelWidth: number
}

export interface NodeMetrics {
  /** Ступень цепочки в режиме «Дорожки». */
  step: NodeRole
  /** Вариант того же тира: жара, холод, вес. */
  variant: NodeRole
  /** Режим «Шкала уровней» — плотнее, потому что узлов в ряду много. */
  dense: NodeRole
  /** Мини-плитка внутри карточки цепочки в режиме «Компактно». */
  mini: NodeRole
  /** Пикселей на уровень по X. Растёт вместе с плиткой, иначе узлы наедут. */
  levelStep: number
  /** Высота ряда без вариантов; на ней же стоит рельса. */
  rowBase: number
  rowHeight: (hasVariants: boolean) => number
}

function role(tile: number): NodeRole {
  return {
    tile,
    // Кламп не даёт бейджам стать нечитаемыми на 48 и игрушечными на 96.
    text: Math.round(Math.min(13, Math.max(9, tile * 0.17))),
    labelWidth: Math.max(tile + 28, 76),
  }
}

export function nodeMetrics(key: NodeSizeKey): NodeMetrics {
  const base = TILE[key]
  const dense = role(Math.round(base * 0.8))
  const rowBase = dense.tile + 16
  const variantRow = Math.round(dense.tile * 0.7) + 12

  return {
    step: role(base),
    variant: role(Math.round(base * 0.72)),
    dense,
    mini: role(Math.round(base * 0.62)),
    // Пол в GRID.levelStep сохраняет привычную плотность на мелких размерах.
    levelStep: Math.max(GRID.levelStep, dense.tile + 8),
    rowBase,
    rowHeight: (hasVariants) => (hasVariants ? rowBase + variantRow : rowBase),
  }
}

/**
 * Переменные ставятся на КОНТЕЙНЕР, а не на узел: вложенные плитки
 * наследуют их, и проп `size` протаскивать не нужно вовсе.
 */
export function nodeVars(role: NodeRole): Record<string, string> {
  return {
    "--node": `${role.tile}px`,
    "--node-text": `${role.text}px`,
    "--node-label": `${role.labelWidth}px`,
  }
}

export function isNodeSizeKey(value: unknown): value is NodeSizeKey {
  return typeof value === "string" && (NODE_SIZE_KEYS as string[]).includes(value)
}
