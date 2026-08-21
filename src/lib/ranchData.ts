import type { RanchFile } from "@/types/ranch"

/**
 * Продукция фермы грузится отдельным маленьким чанком и кэшируется на
 * сессию — тем же приёмом, что палы и дроп. Нужна двум разделам сразу:
 * «Дроп с палов» (ряд «с фермы») и «Навыки палов» (блок в карточке пала).
 */
let cached: Promise<RanchFile> | null = null
let ready: RanchFile | null = null

export function loadRanch(): Promise<RanchFile> {
  cached ??= import("@/data/ranch.json")
    .then((module) => module.default as unknown as RanchFile)
    .then((file) => {
      ready = file
      return file
    })
  return cached
}

/** Готовые данные, если уже загружены: снимает вспышку лоадера при возврате. */
export function peekRanch(): RanchFile | null {
  return ready
}
