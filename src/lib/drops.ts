import { matchesLocalized } from "@/lib/tree"
import type { Locale } from "@/types/tech"
import type { DropResource, DropSource } from "@/types/drop"

/**
 * Чистая логика раздела «Дроп с палов»: порядок источников и поиск.
 * Живёт отдельно от компонентов, потому что именно её проверяют тесты.
 */

/** Средний выход за убийство: количество, взвешенное шансом. */
export const dropYield = (source: DropSource): number =>
  ((source.min + source.max) / 2) * (source.rate / 100)

/**
 * Лучшие добытчики первыми: искали, кого фармить, а не первого по алфавиту.
 * При равном выходе надёжный (с большим шансом) выше; хвост — по id, чтобы
 * порядок был стабильным между рендерами.
 */
export function sortedSources(sources: readonly DropSource[]): DropSource[] {
  return [...sources].sort(
    (a, b) => dropYield(b) - dropYield(a) || b.rate - a.rate || a.palId.localeCompare(b.palId),
  )
}

/** Подпись количества за убийство: «×3» при точном числе, «2–5» при разбросе. */
export const dropQtyLabel = (source: DropSource): string =>
  source.min === source.max ? `×${source.min}` : `${source.min}–${source.max}`

/**
 * Отбор по имени и порядок по алфавиту выбранного языка. Поиск переиспользует
 * правила дерева (нормализация, ё→е, срез склонения) через matchesLocalized.
 */
export function filterResources(
  resources: readonly DropResource[],
  query: string,
  locale: Locale,
): DropResource[] {
  return resources
    .filter((resource) => matchesLocalized(resource.name, query))
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale]))
}
