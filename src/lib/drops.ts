import { matchesLocalized } from "@/lib/tree"
import type { Locale, Localized } from "@/types/tech"
import type { DropResource, DropSource } from "@/types/drop"
import type { RanchFile, RanchProduct } from "@/types/ranch"

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
export function sortedSources<T extends DropSource>(sources: readonly T[]): T[] {
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
export function filterResources<T extends { name: Localized }>(
  resources: readonly T[],
  query: string,
  locale: Locale,
): T[] {
  return resources
    .filter((resource) => matchesLocalized(resource.name, query))
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale]))
}

/** Пал-фермер как источник ресурса: продукт плюс кто его производит. */
export interface FarmSource extends RanchProduct {
  palId: string
}

export interface CombinedResource {
  id: string
  name: Localized
  /** Выпадает при смерти; пусто у ресурсов, которые дают только фермы. */
  sources: DropSource[]
  /** Производится на ферме; пусто у большинства ресурсов. */
  farm: FarmSource[]
}

/**
 * Сливает дроп и продукцию фермы в один список ресурсов раздела. Ресурс,
 * который дают только фермы (сферы Викси, сахарная вата), без слияния было
 * бы вовсе не найти. Имя берётся из дропа, для ферм-только — из ranch.json.
 */
export function combineResources(
  drops: readonly DropResource[],
  ranch: RanchFile,
): CombinedResource[] {
  const byId = new Map<string, CombinedResource>()
  for (const resource of drops) {
    byId.set(resource.id, { ...resource, farm: [] })
  }
  for (const producer of ranch.producers) {
    for (const product of producer.products) {
      let resource = byId.get(product.itemId)
      if (!resource) {
        resource = {
          id: product.itemId,
          name: ranch.items[product.itemId]?.name ?? { ru: product.itemId, en: product.itemId },
          sources: [],
          farm: [],
        }
        byId.set(product.itemId, resource)
      }
      resource.farm.push({ ...product, palId: producer.palId })
    }
  }
  return [...byId.values()]
}
