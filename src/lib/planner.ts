import type { TechData } from "@/lib/data"
import type { RecipeMaterial, Technology } from "@/types/tech"

/**
 * Откуда взялось требование изучить этот шаг.
 *
 * `game` — поле RequireTechnology, единственные настоящие рёбра в игре.
 * `chain` — наша реконструкция: предыдущие ступени того же семейства.
 * Разделение доезжает до интерфейса: маршрут частично построен нами, и
 * выдавать его целиком за требования игры нельзя.
 */
export type StepSource = "target" | "game" | "chain"

export interface RouteStep {
  tech: Technology
  source: StepSource
  researched: boolean
}

export interface RouteBlocker {
  tech: Technology
  boss: string | null
  research: string | null
}

export interface Route {
  target: Technology
  /** Весь маршрут по возрастанию уровня, включая уже изученное. */
  steps: RouteStep[]
  /** Суммы считаются только по неизученному и раздельно: очки разные. */
  techPoints: number
  ancientPoints: number
  /** Максимальный уровень среди оставшихся шагов; null — идти уже некуда. */
  requiredLevel: number | null
  materials: RecipeMaterial[]
  /** Требования, которые очками не закрываются. */
  blockers: RouteBlocker[]
  /** Сколько шагов маршрута — наша реконструкция, а не данные игры. */
  synthesisedSteps: number
}

/**
 * Строит маршрут до цели: всё, что нужно изучить раньше неё.
 *
 * Пререквизиты бывают двух видов. `RequireTechnology` — настоящий, из игры,
 * разворачивается транзитивно. Позиция в цепочке — наша конструкция, и она
 * даёт пререквизиты только у цепочек вида `chain`: у `group` члены
 * равноправны (семь культур, пять модулей сфер), и требовать изучить
 * ягодную плантацию ради пшеничной было бы выдумкой.
 *
 * Гейты по боссу и исследованию лаборатории очками не покупаются, поэтому
 * они выходят отдельным списком, а не прибавляются к стоимости.
 */
export function buildRoute(
  targetId: string,
  data: TechData,
  researched: ReadonlySet<string>,
): Route | null {
  const target = data.byId.get(targetId)
  if (!target) return null

  /**
   * Настоящие рёбра игры собираются ПЕРВЫМИ и побеждают метку цепочки.
   * Порядок здесь не косметика: все 17 рёбер RequireTechnology лежат внутри
   * тех же цепочек, что и их потомки, поэтому при обратном порядке ветка
   * "game" не срабатывала бы никогда, а шаги настоящих цепочек маршрут
   * выдавал бы за нашу реконструкцию — и один и тот же узел оказывался бы
   * помечен в маршруте и не помечен в дереве.
   */
  const gameIds = new Set<string>()

  const followGameEdges = (fromId: string) => {
    const guard = new Set<string>()
    let current = data.byId.get(fromId)?.reqTech ?? null

    while (current && !guard.has(current)) {
      guard.add(current)
      const tech = data.byId.get(current)
      if (!tech) break
      gameIds.add(current)
      current = tech.reqTech
    }
  }

  // Вариант (жара/холод/вес) требует свою же базовую ступень, а не предыдущую.
  const anchorId = data.variantOf.get(targetId) ?? targetId
  const chain = data.chainOf.get(anchorId)
  const anchorIndex = data.indexInChain.get(anchorId) ?? -1

  const chainIds =
    chain && chain.kind === "chain" && anchorIndex >= 0
      ? chain.members.slice(0, anchorIndex + 1).filter((id) => id !== targetId)
      : []

  followGameEdges(targetId)
  for (const id of chainIds) followGameEdges(id)
  for (const id of [...gameIds]) followGameEdges(id)

  const sources = new Map<string, StepSource>()
  for (const id of gameIds) sources.set(id, "game")
  for (const id of chainIds) if (!sources.has(id)) sources.set(id, "chain")
  sources.set(targetId, "target")

  const steps: RouteStep[] = [...sources.entries()]
    .map(([id, source]) => ({ id, source, tech: data.byId.get(id) }))
    .filter((item): item is { id: string; source: StepSource; tech: Technology } =>
      Boolean(item.tech),
    )
    .map(({ tech, source }) => ({ tech, source, researched: researched.has(tech.id) }))
    .sort((a, b) => a.tech.level - b.tech.level || a.tech.cost - b.tech.cost)

  const remaining = steps.filter((step) => !step.researched)

  const materials = new Map<string, RecipeMaterial>()
  for (const step of remaining) {
    const recipe = data.recipes.get(step.tech.id)
    if (!recipe) continue
    for (const material of recipe.materials) {
      const seen = materials.get(material.id)
      if (seen) seen.count += material.count
      else materials.set(material.id, { ...material })
    }
  }

  return {
    target,
    steps,
    techPoints: remaining.reduce((sum, step) => sum + (step.tech.ancient ? 0 : step.tech.cost), 0),
    ancientPoints: remaining.reduce(
      (sum, step) => sum + (step.tech.ancient ? step.tech.cost : 0),
      0,
    ),
    requiredLevel: remaining.length
      ? Math.max(...remaining.map((step) => step.tech.level))
      : null,
    materials: [...materials.values()].sort((a, b) => b.count - a.count || a.id.localeCompare(b.id)),
    blockers: remaining
      .filter((step) => step.tech.reqBoss || step.tech.reqResearch)
      .map((step) => ({
        tech: step.tech,
        boss: step.tech.reqBoss,
        research: step.tech.reqResearch,
      })),
    synthesisedSteps: remaining.filter((step) => step.source === "chain").length,
  }
}
