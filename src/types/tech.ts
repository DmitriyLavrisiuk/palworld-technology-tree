/**
 * Types mirror the game's own DataTable row struct
 * `PalTechnologyRecipeUnlockDataTableRow` from
 * Pal/Content/Pal/DataTable/Technology/DT_TechnologyRecipeUnlock.
 *
 * Note: the source struct has a `Tier` field. It is 0 in all 588 rows and
 * unused by the game — it is deliberately not modelled here.
 */

/** Every row fills either unlockBuild or unlockItems, never both, never neither. */
export type TechCategory = "Items" | "Structures"

export type Locale = "ru" | "en"

export type Localized = Record<Locale, string>

/**
 * Категория предмета по классификации самой игры: она закодирована в пути
 * ассета иконки (`T_icon_buildObject_*`, `T_itemicon_Weapon_*`, каталог
 * `PalIcon/` у снаряжения палов). Это НЕ наша догадка — множество
 * `structure` в точности совпадает с `category === "Structures"`.
 *
 * До этого секции строились эвристикой по словам в названии; она удалена.
 * Побочное следствие игровой классификации: топоры и кирки — оружие,
 * щиты — броня, отдельной категории «инструменты» в игре нет.
 */
export type GroupKey =
  | "structure"
  | "palgear"
  | "weapon"
  | "armor"
  | "ammo"
  | "material"
  | "essential"
  | "sphere"
  | "accessory"
  | "consumable"
  | "glider"

/**
 * How a chain link was established.
 * `hard` links come from the game's own RequireTechnology field (17 exist).
 * Everything else is synthesised by us and may be wrong — see docs/CHAINS.md.
 */
export type ChainConfidence = "hard" | "stem" | "name" | "manual"

export interface Technology {
  /** DataTable row key, e.g. "Special_PalSphere_Grade_03". Stable across patches. */
  id: string
  name: Localized
  description: Localized
  /** LevelCap — character level gate, 1..80. */
  level: number
  /** Point cost, 1..9. Paid in ATP when `ancient` is true, otherwise TP. */
  cost: number
  /** IsBossTechnology — costs Ancient Technology Points. */
  ancient: boolean
  category: TechCategory
  /** Категория из классификации игры. См. GroupKey. */
  group: GroupKey
  /** Icon slug. Does NOT reliably match the CDN path — see docs/DATA_MODEL.md. */
  iconName: string
  /** RequireTechnology — the only real tech-to-tech edges the game defines. */
  reqTech: string | null
  /** RequireDefeatTowerBoss — EPalBossType, cannot be satisfied with points. */
  reqBoss: string | null
  /** RequireResearchId — Pal Labor Research, cannot be satisfied with points. */
  reqResearch: string | null
  unlockBuild: string[]
  unlockItems: string[]
}

/**
 * `chain` means each member upgrades into the next one.
 * `group` means the members belong together but are parallel alternatives —
 * seven crops, five sphere modules — so no progression is implied.
 */
export type ChainKind = "chain" | "group"

export interface Chain {
  id: string
  group: GroupKey
  name: Localized
  kind: ChainKind
  confidence: ChainConfidence
  /** Ordered technology ids, earliest first. */
  members: string[]
  /**
   * Off-chain variants keyed by the member they branch from.
   * Armor uses this: 7 base tiers, each with heat/cold/lightweight variants.
   */
  variants?: Record<string, string[]>
}

/** Bulk with no upgrade semantics — 124 saddles, 33 furniture sets. */
export interface Bucket {
  id: string
  name: Localized
  members: string[]
}

export interface ChainsFile {
  gameVersion: string
  generatedAt: string
  chains: Chain[]
  buckets: Bucket[]
  /**
   * Technologies that fit no chain and no bucket, kept grouped by section so
   * the UI does not have to re-derive the grouping heuristic.
   */
  loose: { group: GroupKey; members: string[] }[]
}

export interface RecipeMaterial {
  id: string
  name: Localized
  count: number
}

export interface Recipe {
  techId: string
  /**
   * Every station the thing can be produced at, in the order paldb lists them.
   * Empty for structures, which are built directly rather than crafted.
   */
  stations: Localized[]
  materials: RecipeMaterial[]
}

/** A planned route to a target technology. */
export interface Route {
  targetId: string
  /** Full ordered route including already-researched steps. */
  steps: Technology[]
  /** Sums exclude steps already marked researched. */
  techPoints: number
  ancientPoints: number
  /** Highest level among the remaining steps, or null if nothing is left. */
  requiredLevel: number | null
  materials: RecipeMaterial[]
  /** Requirements that points cannot buy. */
  blockers: { techId: string; boss: string | null; research: string | null }[]
}
