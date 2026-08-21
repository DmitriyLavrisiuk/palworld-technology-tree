import { matchesLocalized } from "@/lib/tree"
import type { Locale } from "@/types/tech"
import { WORK_ORDER, type ElementKey, type Pal, type WorkKey } from "@/types/pal"

/** Закрытый диапазон уровней или еды. */
export interface Range {
  min: number
  max: number
}

export const inRange = (value: number, range: Range | null): boolean =>
  range === null || (value >= range.min && value <= range.max)

/**
 * Жест выбора диапазона: первый клик — «от», второй — «до».
 *
 * Клик по одиночному выбранному значению снимает выбор; клик внутри уже
 * растянутого диапазона начинает новый с этого места — иначе диапазон
 * невозможно было бы сузить.
 */
export function hitRange(range: Range | null, n: number): Range | null {
  if (!range) return { min: n, max: n }
  if (range.min === range.max) {
    if (n === range.min) return null
    return n > range.min ? { min: range.min, max: n } : { min: n, max: range.min }
  }
  return { min: n, max: n }
}

/**
 * Группы усилителей — наша таксономия поверх 23 игровых пассивок, нужная
 * только фильтру. Карта намеренно явная и полная: новая пассивка после патча
 * роняет тест полноты в data-invariants, и её классифицируют осознанно, а не
 * эвристикой по имени.
 */
export type BuffGroup = "element" | "attack" | "defense" | "legend" | "penalty"

export const BUFF_GROUP_ORDER: BuffGroup[] = ["element", "attack", "defense", "legend", "penalty"]

export const BUFF_GROUP_OF: Record<string, BuffGroup> = {
  ElementBoost_Aqua_2_PAL: "element",
  ElementBoost_Dark_2_PAL: "element",
  ElementBoost_Dragon_2_PAL: "element",
  ElementBoost_Earth_2_PAL: "element",
  ElementBoost_Fire_2_PAL: "element",
  ElementBoost_Ice_2_PAL: "element",
  ElementBoost_Leaf_2_PAL: "element",
  ElementBoost_Normal_2_PAL: "element",
  ElementBoost_Thunder_2_PAL: "element",
  // Двухстихийные усилители урона — «Вечное пламя», «Захватчик», «Ведьма»,
  // «Спаситель»; «Царь-рыба» добавляет защиту, но носит его водный босс —
  // стихийная суть первична.
  EternalFlame: "element",
  Invader: "element",
  Witch: "element",
  Salvation: "element",
  Nushi: "element",
  // «Грубый» и «Садист» платят за атаку штрафом, но берут их ради атаки.
  PAL_rude: "attack",
  PAL_sadist: "attack",
  Alien: "attack",
  Deffence_up1: "defense",
  Deffence_up2_2: "defense",
  ElementResist_Normal_1_PAL: "defense",
  Legend: "legend",
  // Чистые штрафы: не усилители, но их носителей полезно знать в лицо.
  PAL_ALLAttack_down1: "penalty",
  PAL_FullStomach_Up_1: "penalty",
}

export const buffGroupOf = (passiveId: string): BuffGroup | null =>
  BUFF_GROUP_OF[passiveId] ?? null

/** «Любой усилитель» — любая пассивка, кроме чистого штрафа. */
export type BuffFilterKey = BuffGroup | "any"

export interface PalFilters {
  /** Значение `null` у ключа — «умеет, уровень любой». */
  works: ReadonlyMap<WorkKey, Range | null>
  /** Пал подходит, если есть хотя бы одна из выбранных стихий. */
  elements: ReadonlySet<ElementKey>
  food: Range | null
  buffs: ReadonlySet<BuffFilterKey>
  /** Только избранные. Пункт появляется в фильтрах, когда избранное непусто. */
  favoritesOnly: boolean
}

export const NO_PAL_FILTERS: PalFilters = {
  works: new Map(),
  elements: new Set(),
  food: null,
  buffs: new Set(),
  favoritesOnly: false,
}

export function matchesPal(
  pal: Pal,
  filters: PalFilters,
  favorites: ReadonlySet<string> = new Set(),
): boolean {
  if (filters.favoritesOnly && !favorites.has(pal.id)) return false

  for (const [key, range] of filters.works) {
    const level = pal.work[key] ?? 0
    if (level === 0 || !inRange(level, range)) return false
  }

  if (filters.elements.size > 0 && !pal.elements.some((key) => filters.elements.has(key))) {
    return false
  }

  if (!inRange(pal.food, filters.food)) return false

  if (filters.buffs.size > 0) {
    const groups = pal.passives
      .map(buffGroupOf)
      .filter((group): group is BuffGroup => group !== null)
    const positive = groups.filter((group) => group !== "penalty")

    const wanted =
      (filters.buffs.has("any") && positive.length > 0) ||
      groups.some((group) => filters.buffs.has(group))
    if (!wanted) return false
  }

  return true
}

/** Сумма уровней по выбранным работам — ею сортируется выдача. */
export function workScore(pal: Pal, works: PalFilters["works"]): number {
  let total = 0
  for (const key of works.keys()) total += pal.work[key] ?? 0
  return total
}

/**
 * Отбор и порядок. При выбранных работах выше идут те, кто по ним сильнее:
 * искали лучшего, а не первого по алфавиту. Иначе — порядок Палдекса.
 */
export function filterPals(
  pals: readonly Pal[],
  filters: PalFilters,
  query: string,
  locale: Locale,
  favorites: ReadonlySet<string> = new Set(),
): Pal[] {
  const found = pals.filter(
    (pal) => matchesPal(pal, filters, favorites) && matchesLocalized(pal.name, query),
  )

  if (filters.works.size === 0) return found

  return found.sort(
    (a, b) =>
      workScore(b, filters.works) - workScore(a, filters.works) ||
      a.name[locale].localeCompare(b.name[locale]),
  )
}

/**
 * Кеш выдач на сессию: повторный запрос отдаёт прежний массив без пересбора,
 * а неизменная ссылка даёт memo-карточкам пропустить рендер. Привязан к
 * массиву палов через WeakMap, поэтому со сменой данных умирает сам. Язык и
 * избранное входят в ключ — избранное только при включённом фильтре, иначе
 * от него ничего не зависит.
 */
const filterCache = new WeakMap<readonly Pal[], Map<string, Pal[]>>()

export function filterPalsCached(
  pals: readonly Pal[],
  filters: PalFilters,
  query: string,
  locale: Locale,
  favorites: ReadonlySet<string> = new Set(),
): Pal[] {
  let cache = filterCache.get(pals)
  if (!cache) {
    cache = new Map()
    filterCache.set(pals, cache)
  }
  const key = JSON.stringify([
    locale,
    query,
    [...filters.works],
    [...filters.elements],
    filters.food,
    [...filters.buffs],
    filters.favoritesOnly ? [...favorites].sort() : null,
  ])
  const cached = cache.get(key)
  if (cached) return cached
  const result = filterPals(pals, filters, query, locale, favorites)
  cache.set(key, result)
  return result
}

/**
 * Верхняя граница шкалы уровней. Берётся из данных, а не из константы: в игре
 * базовый максимум четыре, у стихийных вариантов доходит до восьми, и после
 * патча это число может измениться.
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

/** Верхняя граница шкалы еды — тоже из данных. */
export function maxFood(pals: readonly Pal[]): number {
  let max = 0
  for (const pal of pals) if (pal.food > max) max = pal.food
  return max
}

/**
 * Работы, которыми хоть кто-то владеет.
 *
 * Нефтедобыча есть полем в игровой таблице, но ни у одного пала Палдекса её
 * нет — у paldb её нет и в фильтрах, и иконки для неё не существует. Показывать
 * такую кнопку значит предлагать фильтр, который всегда даёт пустоту.
 */
export function usedWorkKeys(pals: readonly Pal[]): WorkKey[] {
  const used = new Set<WorkKey>()
  for (const pal of pals) {
    for (const key of Object.keys(pal.work) as WorkKey[]) used.add(key)
  }
  return WORK_ORDER.filter((key) => used.has(key))
}
