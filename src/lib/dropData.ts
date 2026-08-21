import type { DropsFile } from "@/types/drop"

/**
 * Данные дропа грузятся отдельным чанком и кэшируются на сессию — тем же
 * приёмом, что палы (`src/lib/palData.ts`). Портреты палов раздел берёт из
 * `palIconUrl`, поэтому здесь только сами ресурсы и их иконки.
 */
let cached: Promise<DropsFile> | null = null
let ready: DropsFile | null = null

export function loadDrops(): Promise<DropsFile> {
  cached ??= import("@/data/drops.json")
    .then((module) => module.default as unknown as DropsFile)
    .then((file) => {
      ready = file
      return file
    })
  return cached
}

/** Готовые данные, если уже загружены: снимает вспышку лоадера при возврате. */
export function peekDrops(): DropsFile | null {
  return ready
}

export function dropIconUrl(id: string): string {
  return `${import.meta.env.BASE_URL}icons/drops/${id}.webp`
}
