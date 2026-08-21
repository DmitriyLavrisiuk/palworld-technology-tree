import { fetchJson } from "../lib/http.ts"
import type { Locale } from "../../src/types/tech.ts"

/**
 * Descriptions are localisation keys in the DataTable, so they come from a
 * dump of the game's own l10n files instead.
 */
const URL = (locale: Locale, file: string) =>
  "https://raw.githubusercontent.com/oMaN-Rod/palworld-save-pal/main/data/json/l10n/" +
  `${locale}/${file}.json`

interface Entry {
  localized_name?: string
  description?: string
}

export type L10nMap = Record<string, { name: string; description: string }>

export async function fetchDescriptions(locale: Locale, fresh: boolean): Promise<L10nMap> {
  const raw = await fetchJson<Record<string, Entry>>(URL(locale, "technologies"), { fresh })
  const out: L10nMap = {}

  for (const [id, entry] of Object.entries(raw)) {
    out[id] = {
      name: entry.localized_name ?? "",
      description: entry.description ?? "",
    }
  }

  return out
}

/**
 * Имена палов. Ключи здесь расходятся с таблицей по регистру: в таблице
 * `SheepBall`, в дампе `Sheepball`. Поэтому карта строится по ключу в нижнем
 * регистре — при джойне «в лоб» треть палов молча осталась бы без имени.
 */
export async function fetchPalNames(locale: Locale, fresh: boolean): Promise<L10nMap> {
  const raw = await fetchJson<Record<string, Entry>>(URL(locale, "pals"), { fresh })
  const out: L10nMap = {}

  for (const [id, entry] of Object.entries(raw)) {
    out[id.toLowerCase()] = {
      name: entry.localized_name ?? "",
      description: entry.description ?? "",
    }
  }

  return out
}

async function fetchNameMap(locale: Locale, file: string, fresh: boolean): Promise<Record<string, string>> {
  const raw = await fetchJson<Record<string, Entry>>(URL(locale, file), { fresh })
  const out: Record<string, string> = {}

  for (const [key, entry] of Object.entries(raw)) {
    out[key] = entry.localized_name ?? ""
  }

  return out
}

/** Названия рабочих навыков. Ключи совпадают с суффиксами `WorkSuitability_*`. */
export async function fetchWorkNames(locale: Locale, fresh: boolean): Promise<Record<string, string>> {
  return await fetchNameMap(locale, "work_suitability", fresh)
}

/** Названия стихий. Формат тот же, что у работ. */
export async function fetchElementNames(locale: Locale, fresh: boolean): Promise<Record<string, string>> {
  return await fetchNameMap(locale, "elements", fresh)
}

/** Тексты пассивных навыков: имя и описание эффекта. */
export async function fetchPassiveSkills(locale: Locale, fresh: boolean): Promise<L10nMap> {
  const raw = await fetchJson<Record<string, Entry>>(URL(locale, "passive_skills"), { fresh })
  const out: L10nMap = {}

  for (const [id, entry] of Object.entries(raw)) {
    out[id] = { name: entry.localized_name ?? "", description: entry.description ?? "" }
  }

  return out
}
