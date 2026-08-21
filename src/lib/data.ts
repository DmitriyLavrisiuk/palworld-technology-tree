import type { Chain, ChainsFile, Recipe, Technology } from "@/types/tech"

export interface TechData {
  technologies: Technology[]
  chains: ChainsFile
  byId: Map<string, Technology>
  recipes: Map<string, Recipe>
  /** techId → цепочка, в которую он входит, включая вхождение вариантом. */
  chainOf: Map<string, Chain>
  /** techId → позиция в списке членов цепочки; -1 у вариантов. */
  indexInChain: Map<string, number>
  /** Идентификаторы, которые являются вариантом другого узла (жара/холод/вес). */
  variantOf: Map<string, string>
}

/**
 * Данных около 1 МБ, поэтому они грузятся отдельными чанками, а не едут
 * в основном бандле. См. docs/ARCHITECTURE.md.
 *
 * Результат кэшируется на всё время сессии: раздел «Исследования»
 * размонтируется при уходе на экран выбора, и без кэша каждый возврат заново
 * перестраивал бы индексы по 588 технологиям — со скелетоном на ровном месте.
 * Данные неизменяемы, поэтому один объект на всех безопасен.
 */
let cached: Promise<TechData> | null = null
let ready: TechData | null = null

export function loadTechData(): Promise<TechData> {
  cached ??= buildTechData().then((data) => {
    ready = data
    return data
  })
  return cached
}

/**
 * Готовые данные, если они уже загружены. Нужно разделу для стартового
 * состояния: даже разрешённый промис отдаёт значение только в микрозадаче, а
 * до неё успевает отрисоваться кадр со скелетоном — при возврате в раздел это
 * видно вспышкой.
 */
export function peekTechData(): TechData | null {
  return ready
}

async function buildTechData(): Promise<TechData> {
  const [technologies, chains, recipes] = await Promise.all([
    import("@/data/technologies.json").then((m) => m.default as unknown as Technology[]),
    import("@/data/chains.json").then((m) => m.default as unknown as ChainsFile),
    import("@/data/recipes.json").then((m) => m.default as unknown as Recipe[]),
  ])

  const byId = new Map(technologies.map((tech) => [tech.id, tech]))
  const chainOf = new Map<string, Chain>()
  const indexInChain = new Map<string, number>()
  const variantOf = new Map<string, string>()

  for (const chain of chains.chains) {
    chain.members.forEach((id, index) => {
      chainOf.set(id, chain)
      indexInChain.set(id, index)
    })
    for (const [base, list] of Object.entries(chain.variants ?? {})) {
      for (const id of list) {
        chainOf.set(id, chain)
        indexInChain.set(id, -1)
        variantOf.set(id, base)
      }
    }
  }

  return {
    technologies,
    chains,
    byId,
    recipes: new Map(recipes.map((recipe) => [recipe.techId, recipe])),
    chainOf,
    indexInChain,
    variantOf,
  }
}

/** Иконки лежат в public/, поэтому им нужен префикс базового пути деплоя. */
export function iconUrl(techId: string): string {
  return `${import.meta.env.BASE_URL}icons/${techId}.webp`
}

/**
 * Материалы держатся в отдельном каталоге: шесть их идентификаторов
 * совпадают с идентификаторами технологий и в общем каталоге затёрли бы их.
 */
export function materialIconUrl(materialId: string): string {
  return `${import.meta.env.BASE_URL}icons/materials/${materialId}.webp`
}

/** Верстаки и станки — свой каталог по той же причине, что и материалы. */
export function stationIconUrl(stationId: string): string {
  return `${import.meta.env.BASE_URL}icons/stations/${stationId}.webp`
}
