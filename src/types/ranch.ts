import type { Localized } from "./tech.ts"

/**
 * Продукция фермы: что пал производит, если поставить его на работу
 * «Фермерство». Источник — таблицы «Lv. / Item» на страницах палов paldb:
 * в зеркале игровых таблиц этих данных нет.
 */

export interface RanchProduct {
  itemId: string
  /** С какого уровня партнёрского навыка предмет появляется; обычно 1. */
  unlockLevel: number
  /** Количество за цикл на уровне появления. */
  min: number
  max: number
  /** Количество за цикл на 10-м уровне навыка — потолок. */
  min10: number
  max10: number
  /** Шанс в процентах; у paldb бывает дробным (59.524). */
  rate: number
}

export interface RanchProducer {
  palId: string
  products: RanchProduct[]
}

export interface RanchFile {
  gameVersion: string
  generatedAt: string
  /** Имена предметов кладутся один раз, а не в каждом продукте. */
  items: Record<string, { name: Localized }>
  producers: RanchProducer[]
}
