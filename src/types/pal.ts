import type { Localized } from "./tech.ts"

/**
 * Рабочие навыки. Ключи — игровые, из полей `WorkSuitability_*` таблицы
 * `DT_PalMonsterParameter`, и они же служат ключами в дампе локализации
 * (`work_suitability.json`). Свои названия не выдумываем: тогда пришлось бы
 * держать таблицу соответствий, которая разъедется на первом же патче.
 */
export type WorkKey =
  | "EmitFlame"
  | "Watering"
  | "Seeding"
  | "GenerateElectricity"
  | "Handcraft"
  | "Collection"
  | "Deforest"
  | "Mining"
  | "OilExtraction"
  | "ProductMedicine"
  | "Cool"
  | "Transport"
  | "MonsterFarm"

/** Порядок как в игре: он же порядок иконок `T_icon_palwork_NN`. */
export const WORK_ORDER: WorkKey[] = [
  "EmitFlame",
  "Watering",
  "Seeding",
  "GenerateElectricity",
  "Handcraft",
  "Collection",
  "Deforest",
  "Mining",
  "OilExtraction",
  "ProductMedicine",
  "Cool",
  "Transport",
  "MonsterFarm",
]

export type ElementKey =
  | "Normal"
  | "Fire"
  | "Water"
  | "Leaf"
  | "Electricity"
  | "Ice"
  | "Earth"
  | "Dark"
  | "Dragon"

export const ELEMENT_ORDER: ElementKey[] = [
  "Normal",
  "Fire",
  "Water",
  "Leaf",
  "Electricity",
  "Ice",
  "Earth",
  "Dark",
  "Dragon",
]

export type PalSize = "XS" | "S" | "M" | "L" | "XL"

export interface Pal {
  /** Ключ строки DataTable, например `SheepBall`. Стабилен между патчами. */
  id: string
  /** Номер в Палдексе. Отбор по `> 0` и отсекает боссов, рейды и квестовых. */
  dexNo: number
  /** Суффикс номера у стихийных вариантов: `121B` — это Jormuntide Ignis. */
  dexSuffix: string
  name: Localized
  /** Одна или две стихии. */
  elements: ElementKey[]
  /** Только ненулевые уровни: нулевых втрое больше, и в файле они мусор. */
  work: Partial<Record<WorkKey, number>>
  nocturnal: boolean
  size: PalSize
  /**
   * Скорость переноски. Вместимости («сколько предметов за раз») в игровых
   * данных нет вовсе — проверены все 90 полей таблицы и страницы paldb.
   */
  transportSpeed: number
}

/** Локализованные названия навыков — тоже из дампа, а не из нашего словаря. */
export type WorkNames = Record<WorkKey, Localized>

export type ElementNames = Record<ElementKey, Localized>

export interface PalsFile {
  gameVersion: string
  generatedAt: string
  workNames: WorkNames
  elementNames: ElementNames
  pals: Pal[]
}
