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

export const GROUP_ORDER: GroupKey[] = ["gear", "armor", "tools", "weapon", "base"]

export const GROUP_NAMES: Record<GroupKey, Localized> = {
  gear: { ru: "Снаряжение", en: "Gear" },
  armor: { ru: "Броня", en: "Armor" },
  tools: { ru: "Инструменты", en: "Tools" },
  weapon: { ru: "Оружие", en: "Weapons" },
  base: { ru: "База и производство", en: "Base & Production" },
}

/** Internal-id prefixes pulled out of chain building entirely. */
export const BUCKET_PREFIXES = {
  saddles: "SkillUnlock_",
  furniture: "FurnitureSet_",
} as const
