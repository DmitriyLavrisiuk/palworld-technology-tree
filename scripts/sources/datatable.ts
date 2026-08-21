import { fetchJson } from "../lib/http.ts"
import { WORK_ORDER, type ElementKey, type PalSize, type WorkKey } from "../../src/types/pal.ts"

/**
 * FModel export of the game's own table. Mirrored on GitHub, so this is one
 * request rather than a .pak extraction.
 */
const MIRROR =
  "https://raw.githubusercontent.com/CreativeTechGuy/PalworldDBIndex/main/src/raw_data/Pal/Content/Pal/DataTable/"

const URL = `${MIRROR}Technology/DT_TechnologyRecipeUnlock.json`
const PAL_URL = `${MIRROR}Character/DT_PalMonsterParameter.json`

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

/**
 * Строка таблицы палов. Из девяноста полей берём те, что нужны разделу
 * рабочих навыков; остальное — боевые статы и внутренняя механика.
 */
interface RawPal {
  IsPal: boolean
  ZukanIndex: number
  ZukanIndexSuffix: string
  Size: string
  ElementType1: string
  ElementType2: string
  Nocturnal: boolean
  TransportSpeed: number
  WorkSuitability_EmitFlame: number
  WorkSuitability_Watering: number
  WorkSuitability_Seeding: number
  WorkSuitability_GenerateElectricity: number
  WorkSuitability_Handcraft: number
  WorkSuitability_Collection: number
  WorkSuitability_Deforest: number
  WorkSuitability_Mining: number
  WorkSuitability_OilExtraction: number
  WorkSuitability_ProductMedicine: number
  WorkSuitability_Cool: number
  WorkSuitability_Transport: number
  WorkSuitability_MonsterFarm: number
}

interface PalExport {
  Rows?: Record<string, RawPal>
}

export interface PalTableRow {
  id: string
  dexNo: number
  dexSuffix: string
  size: PalSize
  elements: ElementKey[]
  nocturnal: boolean
  transportSpeed: number
  work: Partial<Record<WorkKey, number>>
}

function stripEnum(value: string | undefined, prefix: string): string | null {
  if (!value) return null
  const bare = value.replace(prefix, "")
  return bare === "None" ? null : bare
}

/**
 * Отдаёт только палов из Палдекса: `ZukanIndex > 0` само по себе отсекает
 * босс-версии, рейдовых, башенных и квестовых — из 753 строк остаётся 303.
 * Стихийные варианты при этом остаются, у них свой номер с суффиксом.
 */
export async function fetchPalTable(fresh: boolean): Promise<PalTableRow[]> {
  const exports = await fetchJson<PalExport[]>(PAL_URL, { fresh })
  const table = exports.find((entry) => entry.Rows)
  if (!table?.Rows) throw new Error("Pal DataTable export contains no Rows")

  const rows: PalTableRow[] = []

  for (const [id, row] of Object.entries(table.Rows)) {
    if (!row.IsPal || row.ZukanIndex <= 0) continue

    const work: Partial<Record<WorkKey, number>> = {}
    for (const key of WORK_ORDER) {
      const level = row[`WorkSuitability_${key}` as keyof RawPal] as number
      if (level > 0) work[key] = level
    }

    const elements = [
      stripEnum(row.ElementType1, "EPalElementType::"),
      stripEnum(row.ElementType2, "EPalElementType::"),
    ].filter((value): value is ElementKey => Boolean(value))

    rows.push({
      id,
      dexNo: row.ZukanIndex,
      dexSuffix: row.ZukanIndexSuffix ?? "",
      size: (stripEnum(row.Size, "EPalSizeType::") ?? "M") as PalSize,
      elements,
      nocturnal: row.Nocturnal,
      transportSpeed: row.TransportSpeed,
      work,
    })
  }

  return rows
}
