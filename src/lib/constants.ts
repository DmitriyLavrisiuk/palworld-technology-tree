import type { GroupKey, Localized } from "../types/tech.ts"

/** Verified against DT_TechnologyRecipeUnlock at game version 1.0.3. */
export const GAME_VERSION = "1.0.3"
export const MAX_LEVEL = 80
export const TOTAL_TECHS = 588
export const TOTAL_REGULAR = 537
export const TOTAL_ANCIENT = 51
/** Sum of Cost over all regular technologies. Guides quoting 1143 are wrong. */
export const TOTAL_TECH_POINTS = 1413
export const TOTAL_ANCIENT_POINTS = 182
export const POINTS_PER_LEVEL = 6

/**
 * Grid follows Rust's tech tree lattice, whose base unit is half a node tile.
 * Flush siblings sit one NODE apart; separate branches one ROW_PITCH apart,
 * so spacing itself encodes grouping.
 */
export const GRID = {
  node: 128,
  gutter: 64,
  rowPitch: 192,
  /** Half a node — the lattice unit everything else is a multiple of. */
  unit: 64,
  /** Horizontal pixels per character level on the level-axis view. */
  levelStep: 58,
  /** Stroke width for connector rails, ~0.03 x node. */
  railWidth: 4,
} as const

/** Below this zoom scale, nodes render icon-only — the Rust legibility trick. */
export const LABEL_ZOOM_THRESHOLD = 0.8

export const ZOOM = { min: 0.35, max: 2.5, initial: 1 } as const

/** Movement beyond this many pixels turns a click into a drag. */
export const DRAG_THRESHOLD = 4

/** Порядок секций: сперва то, чего больше и что ищут чаще. */
export const GROUP_ORDER: GroupKey[] = [
  "structure",
  "weapon",
  "armor",
  "ammo",
  "sphere",
  "material",
  "consumable",
  "essential",
  "accessory",
  "glider",
  "palgear",
]

export const GROUP_NAMES: Record<GroupKey, Localized> = {
  structure: { ru: "Постройки", en: "Structures" },
  weapon: { ru: "Оружие", en: "Weapons" },
  armor: { ru: "Броня и щиты", en: "Armor & Shields" },
  ammo: { ru: "Боеприпасы", en: "Ammo" },
  sphere: { ru: "Сферы и модули", en: "Spheres & Modules" },
  material: { ru: "Ресурсы", en: "Materials" },
  consumable: { ru: "Расходники и еда", en: "Consumables & Food" },
  essential: { ru: "Ключевые предметы", en: "Essentials" },
  accessory: { ru: "Аксессуары", en: "Accessories" },
  glider: { ru: "Планеры", en: "Gliders" },
  palgear: { ru: "Снаряжение палов", en: "Pal Gear" },
}

/** Internal-id prefixes pulled out of chain building entirely. */
export const BUCKET_PREFIXES = {
  saddles: "SkillUnlock_",
  furniture: "FurnitureSet_",
} as const
