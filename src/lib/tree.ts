import type { Chain, ChainConfidence, ChainKind, GroupKey, Localized, Technology } from "@/types/tech"

/**
 * Чистая логика дерева: состояние узла, поиск и фильтры. Живёт отдельно от
 * компонентов, потому что именно её проверяют тесты — раскладку глазами
 * видно, а «почему этот узел серый» уже нет.
 */

export type NodeStatus = "researched" | "available" | "locked"

export interface Filters {
  availableOnly: boolean
  ancientOnly: boolean
  hideResearched: boolean
  /** Показываемые категории. Пустой набор означает «все». */
  groups: ReadonlySet<GroupKey>
}

export const NO_FILTERS: Filters = {
  availableOnly: false,
  ancientOnly: false,
  hideResearched: false,
  groups: new Set(),
}

/**
 * Уровень персонажа — единственный гейт, который виден по данным. Победа над
 * боссом и исследование лаборатории проверить нельзя: игра о них не
 * рассказывает, поэтому они показываются в деталях, а не красят узел.
 */
export function nodeStatus(
  tech: Technology,
  researched: ReadonlySet<string>,
  playerLevel: number,
): NodeStatus {
  if (researched.has(tech.id)) return "researched"
  return tech.level <= playerLevel ? "available" : "locked"
}

/** Требования, которые очками не закрываются. Показываются в панели деталей. */
export function hardGates(tech: Technology): { boss: string | null; research: string | null } {
  return { boss: tech.reqBoss, research: tech.reqResearch }
}

/**
 * Русские названия игрок помнит по локализации, гайды читает по-английски,
 * поэтому ищем по обоим языкам сразу. «ё» приводится к «е»: в игре пишут
 * «Мешочек», в поиске набирают как придётся.
 */
function normalise(text: string): string {
  return text.toLowerCase().replace(/ё/g, "е").trim()
}

function wordsOf(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
}

/**
 * Русский склоняется, и подстрока этого не переживает: «сфера» не находит
 * «конвейерная фабрика сфер». Поэтому у запроса от пяти букв отбрасывается
 * последняя, и ищется слово, начинающееся с получившегося корня. Порог в
 * пять букв не случаен: у более коротких запросов корень вышел бы в две-три
 * буквы и поймал полсловаря.
 *
 * По внутреннему id намеренно НЕ ищем: `SphereModule_Curve` называется
 * «Модуль дуги», слова «сфера» нет ни в одном из двух названий, и в выдаче
 * по запросу «sphere» такая строка выглядит случайной. Из-за этого же
 * расходились результаты на русском и английском.
 */
function matchesName(name: string, needle: string): boolean {
  const text = normalise(name)
  if (text.includes(needle)) return true
  if (needle.length < 5) return false
  const stem = needle.slice(0, -1)
  return wordsOf(text).some((word) => word.startsWith(stem))
}

/**
 * Поиск по паре названий. Вынесен из `matches`, потому что те же правила
 * нужны разделу палов: правила поиска должны жить в одном месте, иначе
 * русское склонение однажды заработает в дереве и не заработает у палов.
 */
export function matchesLocalized(name: Localized, query: string): boolean {
  const needle = normalise(query)
  if (!needle) return true
  return matchesName(name.ru, needle) || matchesName(name.en, needle)
}

export function matches(tech: Technology, query: string): boolean {
  return matchesLocalized(tech.name, query)
}

export function passesFilters(
  tech: Technology,
  status: NodeStatus,
  filters: Filters,
): boolean {
  if (filters.groups.size > 0 && !filters.groups.has(tech.group)) return false
  if (filters.ancientOnly && !tech.ancient) return false
  if (filters.hideResearched && status === "researched") return false
  if (filters.availableOnly && status !== "available") return false
  return true
}

/**
 * Синтезированная связь — та, которую построили мы, а не игра. `manual`
 * тоже наша, но вычитана человеком, поэтому в интерфейсе честнее делить
 * на «из игры» и «достроено»: пометку заслуживает всё, кроме `hard`.
 */
export function isSynthesised(confidence: ChainConfidence): boolean {
  return confidence !== "hard"
}

/** Догадка алгоритма без человеческой проверки — самый слабый уровень. */
export function isGuessed(confidence: ChainConfidence): boolean {
  return confidence === "stem" || confidence === "name"
}

export interface VisibleTech {
  tech: Technology
  status: NodeStatus
}

/** Отбирает и размечает узлы один раз, чтобы компоненты не считали это заново. */
export function visibleTechs(
  technologies: readonly Technology[],
  researched: ReadonlySet<string>,
  playerLevel: number,
  query: string,
  filters: Filters,
): VisibleTech[] {
  const result: VisibleTech[] = []
  for (const tech of technologies) {
    if (!matches(tech, query)) continue
    const status = nodeStatus(tech, researched, playerLevel)
    if (!passesFilters(tech, status, filters)) continue
    result.push({ tech, status })
  }
  return result
}

/** Цепочка, у которой после фильтров не осталось членов, не рисуется вовсе. */
export function chainMembersVisible(chain: Chain, visible: ReadonlySet<string>): string[] {
  return chain.members.filter((id) => visible.has(id))
}

/**
 * Раскладывает технологии без цепочки в несколько рядов так, чтобы соседи
 * не наезжали друг на друга: жадно кладём в первый ряд, где предыдущий узел
 * закончился раньше начала текущего. 162 узла из 588 живут именно здесь.
 */
export function packRows(members: Technology[], spanInLevels: number): Technology[][] {
  const rows: { lastLevel: number; items: Technology[] }[] = []

  for (const tech of [...members].sort((a, b) => a.level - b.level || a.cost - b.cost)) {
    const row = rows.find((candidate) => tech.level - candidate.lastLevel >= spanInLevels)
    if (row) {
      row.items.push(tech)
      row.lastLevel = tech.level
    } else {
      rows.push({ lastLevel: tech.level, items: [tech] })
    }
  }

  return rows.map((row) => row.items)
}

export interface ResearchedTotals {
  count: number
  techPoints: number
  ancientPoints: number
}

/** Сколько уже изучено и во сколько очков это обошлось. Очки — раздельно. */
export function researchedTotals(
  technologies: readonly Technology[],
  researched: ReadonlySet<string>,
): ResearchedTotals {
  let count = 0
  let techPoints = 0
  let ancientPoints = 0

  for (const tech of technologies) {
    if (!researched.has(tech.id)) continue
    count++
    if (tech.ancient) ancientPoints += tech.cost
    else techPoints += tech.cost
  }

  return { count, techPoints, ancientPoints }
}

export interface ChainSummary {
  count: number
  minLevel: number
  maxLevel: number
  techPoints: number
  ancientPoints: number
}

/** Сводка по цепочке для её заголовка. Очки — раздельно, как везде. */
export function chainSummary(techs: readonly Technology[]): ChainSummary | null {
  if (!techs.length) return null

  let techPoints = 0
  let ancientPoints = 0
  let minLevel = Infinity
  let maxLevel = -Infinity

  for (const tech of techs) {
    if (tech.ancient) ancientPoints += tech.cost
    else techPoints += tech.cost
    minLevel = Math.min(minLevel, tech.level)
    maxLevel = Math.max(maxLevel, tech.level)
  }

  return { count: techs.length, minLevel, maxLevel, techPoints, ancientPoints }
}

/** Что рисовать между двумя соседними видимыми ступенями. */
export type Connector = "arrow" | "gap" | "none"

/**
 * Правило продукта, а не оформления: стрелка утверждает порядок. У цепочки
 * вида `group` члены равноправны, а вырезанная фильтром середина не даёт
 * права соединять то, что осталось — в обоих случаях стрелка соврала бы.
 *
 * Живёт здесь, а не в компоненте: иначе при втором месте отрисовки правило
 * скопируют, и одна из копий отстанет.
 */
export function connectorBetween(
  previousIndex: number,
  nextIndex: number,
  kind: ChainKind,
): Connector {
  if (nextIndex - previousIndex !== 1) return "gap"
  return kind === "chain" ? "arrow" : "none"
}

/** Сколько технологий в каждой категории — для подписи в списке категорий. */
export function countByGroup(
  technologies: readonly Technology[],
): ReadonlyMap<GroupKey, number> {
  const counts = new Map<GroupKey, number>()
  for (const tech of technologies) {
    counts.set(tech.group, (counts.get(tech.group) ?? 0) + 1)
  }
  return counts
}
