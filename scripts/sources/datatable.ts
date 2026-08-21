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
const DROP_URL = `${MIRROR}Character/DT_PalDropItem.json`

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
  FoodAmount: number
  TransportSpeed: number
  PassiveSkill1: string
  PassiveSkill2: string
  PassiveSkill3: string
  PassiveSkill4: string
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
  food: number
  transportSpeed: number
  work: Partial<Record<WorkKey, number>>
  passives: string[]
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
      food: row.FoodAmount,
      transportSpeed: row.TransportSpeed,
      work,
      passives: [row.PassiveSkill1, row.PassiveSkill2, row.PassiveSkill3, row.PassiveSkill4]
        .filter((skill): skill is string => Boolean(skill) && skill !== "None"),
    })
  }

  return rows
}

interface RawDrop {
  CharacterID: string
  Level: number
  [slot: string]: unknown
}

interface DropExport {
  Rows?: Record<string, RawDrop>
}

export interface DropSlot {
  itemId: string
  /** Шанс в процентах. */
  rate: number
  min: number
  max: number
}

export interface DropTableRow {
  /** CharacterID — тот же ключ, что id пала в DT_PalMonsterParameter. */
  id: string
  slots: DropSlot[]
}

/**
 * Дроп палов. Берётся только базовая строка `Level 0`: строки уровней 10–80
 * описывают эндгейм-дроп «пробуждения» (реликвии Древа и души) поверх
 * базового и в раздел не входят. Регистр itemId в таблице гуляет — у одного
 * пала «poppy» строчными; нормализация живёт на этапе сборки, где есть карта
 * ключей локализации.
 */
export async function fetchDropTable(fresh: boolean): Promise<DropTableRow[]> {
  const exports = await fetchJson<DropExport[]>(DROP_URL, { fresh })
  const table = exports.find((entry) => entry.Rows)
  if (!table?.Rows) throw new Error("Drop DataTable export contains no Rows")

  const rows: DropTableRow[] = []
  const seen = new Set<string>()

  for (const row of Object.values(table.Rows)) {
    if (row.Level !== 0 || seen.has(row.CharacterID)) continue
    seen.add(row.CharacterID)

    const slots: DropSlot[] = []
    for (let index = 1; index <= 10; index++) {
      const itemId = row[`ItemId${index}`] as string | undefined
      if (!itemId || itemId === "None") continue
      slots.push({
        itemId,
        rate: row[`Rate${index}`] as number,
        // Регистр полей в таблице именно такой: min строчными, Max заглавной.
        min: row[`min${index}`] as number,
        max: row[`Max${index}`] as number,
      })
    }

    if (slots.length > 0) rows.push({ id: row.CharacterID, slots })
  }

  return rows
}
