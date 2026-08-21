import type { Localized } from "./tech.ts"

/**
 * Дроп с палов: что выпадает при смерти пала. Источник — игровая таблица
 * `DT_PalDropItem`, берётся только базовая строка (Level 0): строки 80-го
 * уровня описывают эндгейм-дроп «пробуждения» и в раздел не входят.
 */

/** Один пал как источник ресурса. */
export interface DropSource {
  palId: string
  /** Сколько падает за убийство. */
  min: number
  max: number
  /** Шанс в процентах, 1–100. */
  rate: number
}

export interface DropResource {
  /** Игровой id предмета — ключ локализации и имя файла иконки. */
  id: string
  name: Localized
  sources: DropSource[]
}

export interface DropsFile {
  gameVersion: string
  generatedAt: string
  resources: DropResource[]
}
