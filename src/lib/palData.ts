import type { PalsFile } from "@/types/pal"

/**
 * Данные палов грузятся отдельным чанком и кэшируются на сессию — тем же
 * приёмом, что и дерево (`src/lib/data.ts`). Раздел размонтируется при уходе
 * на экран выбора, и без кэша каждый возврат заново гонял бы загрузку.
 */
let cached: Promise<PalsFile> | null = null
let ready: PalsFile | null = null

export function loadPals(): Promise<PalsFile> {
  cached ??= import("@/data/pals.json")
    .then((module) => module.default as unknown as PalsFile)
    .then((file) => {
      ready = file
      return file
    })
  return cached
}

/** Готовые данные, если уже загружены: снимает вспышку лоадера при возврате. */
export function peekPals(): PalsFile | null {
  return ready
}

export function palIconUrl(id: string): string {
  return `${import.meta.env.BASE_URL}icons/pals/${id}.webp`
}

export function workIconUrl(key: string): string {
  return `${import.meta.env.BASE_URL}icons/work/${key}.webp`
}
