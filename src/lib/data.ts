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
 */
export async function loadTechData(): Promise<TechData> {
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
