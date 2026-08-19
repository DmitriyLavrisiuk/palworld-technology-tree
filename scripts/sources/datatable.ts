import { fetchJson } from "../lib/http.ts"

/**
 * FModel export of the game's own table. Mirrored on GitHub, so this is one
 * request rather than a .pak extraction.
 */
const URL =
  "https://raw.githubusercontent.com/CreativeTechGuy/PalworldDBIndex/main/src/raw_data/" +
  "Pal/Content/Pal/DataTable/Technology/DT_TechnologyRecipeUnlock.json"

export interface RawRow {
  UnlockBuildObjects: string[]
  UnlockItemRecipes: string[]
  Name: string
  Description: string
  IconName: string
  RequireDefeatTowerBoss: string
  RequireTechnology: string
  RequireResearchId: string
  IsBossTechnology: boolean
  LevelCap: number
  Tier: number
  Cost: number
}

interface Export {
  Type: string
  Rows?: Record<string, RawRow>
}

/** "None" is the table's null. */
function optional(value: string | undefined): string | null {
  if (!value || value === "None") return null
  return value
}

export interface DataTableRow {
  id: string
  level: number
  cost: number
  ancient: boolean
  iconName: string
  reqTech: string | null
  reqBoss: string | null
  reqResearch: string | null
  unlockBuild: string[]
  unlockItems: string[]
}

export async function fetchDataTable(fresh: boolean): Promise<DataTableRow[]> {
  const exports = await fetchJson<Export[]>(URL, { fresh })
  const table = exports.find((entry) => entry.Rows)
  if (!table?.Rows) throw new Error("DataTable export contains no Rows")

  return Object.entries(table.Rows).map(([id, row]) => ({
    id,
    level: row.LevelCap,
    cost: row.Cost,
    ancient: row.IsBossTechnology,
    iconName: row.IconName,
    reqTech: optional(row.RequireTechnology),
    // The enum is namespaced, e.g. "EPalBossType::GrassBoss" — strip the
    // namespace before testing for the null value, or "EPalBossType::None"
    // survives as the string "None".
    reqBoss: optional(row.RequireDefeatTowerBoss?.replace(/^EPalBossType::/, "")),
    reqResearch: optional(row.RequireResearchId),
    unlockBuild: row.UnlockBuildObjects ?? [],
    unlockItems: row.UnlockItemRecipes ?? [],
  }))
}
