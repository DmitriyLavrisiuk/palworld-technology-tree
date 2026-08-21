import { matchesLocalized } from "@/lib/tree"
import type { Locale } from "@/types/tech"
import type { Pal, WorkKey } from "@/types/pal"

/**
 * Подбор пала под работы базы.
 *
 * Требование — это «не ниже», а не «ровно»: игрок закрывает работу, и пал с
 * запасом ему подходит. Требования складываются по «и»: выбрав добычу и рубку,
 * игрок ищет одного пала, который умеет и то и другое, а не двух разных.
 */
export type WorkRequirement = ReadonlyMap<WorkKey, number>

export function matchesWork(pal: Pal, required: WorkRequirement): boolean {
  for (const [key, level] of required) {
    if ((pal.work[key] ?? 0) < level) return false
  }
  return true
}

/** Сумма уровней по выбранным работам — ею сортируется выдача. */
export function workScore(pal: Pal, required: WorkRequirement): number {
  let total = 0
  for (const key of required.keys()) total += pal.work[key] ?? 0
  return total
}

/**
 * Отбор и порядок. При активном фильтре выше идут те, кто по выбранным
 * работам сильнее: искали лучшего, а не первого по алфавиту. Без фильтра —
 * порядок Палдекса, как в игре.
 */
export function filterPals(
  pals: readonly Pal[],
  required: WorkRequirement,
  query: string,
  locale: Locale,
): Pal[] {
  const found = pals.filter((pal) => matchesWork(pal, required) && matchesLocalized(pal.name, query))

  if (required.size === 0) return found

  return found.sort(
    (a, b) =>
      workScore(b, required) - workScore(a, required) ||
      a.name[locale].localeCompare(b.name[locale]),
  )
}

/**
 * Верхняя граница шкалы уровней. Берётся из данных, а не из константы: в игре
 * базовый максимум четыре, у стихийных вариантов доходит до восьми, и после
 * патча это число может измениться. Предположи мы его — интерфейс однажды
 * предложил бы уровень, которого не существует.
 */
export function maxWorkLevel(pals: readonly Pal[]): number {
  let max = 0
  for (const pal of pals) {
    for (const level of Object.values(pal.work)) {
      if (level > max) max = level
    }
  }
  return max
}
