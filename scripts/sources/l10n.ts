import { fetchJson } from "../lib/http.ts"
import type { Locale } from "../../src/types/tech.ts"

/**
 * Descriptions are localisation keys in the DataTable, so they come from a
 * dump of the game's own l10n files instead.
 */
const URL = (locale: Locale) =>
  "https://raw.githubusercontent.com/oMaN-Rod/palworld-save-pal/main/data/json/l10n/" +
  `${locale}/technologies.json`

interface Entry {
  localized_name?: string
  description?: string
}

export type L10nMap = Record<string, { name: string; description: string }>

export async function fetchDescriptions(locale: Locale, fresh: boolean): Promise<L10nMap> {
  const raw = await fetchJson<Record<string, Entry>>(URL(locale), { fresh })
  const out: L10nMap = {}

  for (const [id, entry] of Object.entries(raw)) {
    out[id] = {
      name: entry.localized_name ?? "",
      description: entry.description ?? "",
    }
  }

  return out
}
