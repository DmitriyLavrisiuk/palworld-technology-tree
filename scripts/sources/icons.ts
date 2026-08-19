import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { fetchBuffer } from "../lib/http.ts"
import { log } from "../lib/log.ts"

const OUT_DIR = "public/icons"

/**
 * Icons are named by technology id, not by the DataTable's IconName slug —
 * that slug does not reliably resolve on the CDN (roughly a fifth 404).
 * The URL is taken from the tech list page instead, which always resolves.
 */
export async function downloadIcons(
  entries: { id: string; icon: string }[],
  fresh: boolean,
): Promise<{ saved: number; failed: string[] }> {
  await mkdir(OUT_DIR, { recursive: true })

  let saved = 0
  const failed: string[] = []
  let index = 0

  for (const entry of entries) {
    index++
    log.progress(index, entries.length, "icons")

    const target = join(OUT_DIR, `${entry.id}.webp`)
    if (!fresh && existsSync(target)) {
      saved++
      continue
    }

    if (!entry.icon) {
      failed.push(entry.id)
      continue
    }

    try {
      const body = await fetchBuffer(entry.icon, ".webp", { fresh, allowMissing: true })
      if (!body) {
        failed.push(entry.id)
        continue
      }
      await writeFile(target, body)
      saved++
    } catch {
      failed.push(entry.id)
    }
  }

  return { saved, failed }
}
