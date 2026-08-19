import type { Chain, ChainConfidence, Technology } from "@/types/tech"

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
}

export const NO_FILTERS: Filters = {
  availableOnly: false,
  ancientOnly: false,
  hideResearched: false,
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

export function matches(tech: Technology, query: string): boolean {
  const needle = normalise(query)
  if (!needle) return true
  return matchesName(tech.name.ru, needle) || matchesName(tech.name.en, needle)
}

export function passesFilters(
  tech: Technology,
  status: NodeStatus,
  filters: Filters,
): boolean {
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
