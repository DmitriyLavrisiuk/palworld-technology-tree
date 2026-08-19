import type { Locale, Localized } from "@/types/tech"

/** Два языка, один пользователь — словарь выигрывает у i18n-библиотеки. */
export const UI = {
  appName: { ru: "Древо технологий Palworld", en: "Palworld Technology Tree" },
  loading: { ru: "Загрузка данных…", en: "Loading data…" },
  loadFailed: { ru: "Не удалось загрузить данные", en: "Failed to load data" },

  search: { ru: "Поиск технологии…", en: "Search technology…" },
  myLevel: { ru: "Мой уровень", en: "My level" },

  viewLevels: { ru: "Шкала уровней", en: "Level axis" },
  viewLanes: { ru: "Дорожки", en: "Lanes" },
  viewCompact: { ru: "Компактно", en: "Compact" },

  filterAvailable: { ru: "Только доступные", en: "Available only" },
  filterAncient: { ru: "Только древние", en: "Ancient only" },
  filterHideDone: { ru: "Скрыть изученные", en: "Hide researched" },
  filters: { ru: "Фильтры", en: "Filters" },

  themeLight: { ru: "Светлая тема", en: "Light theme" },
  themeDark: { ru: "Тёмная тема", en: "Dark theme" },
  themeSystem: { ru: "Как в системе", en: "System theme" },

  level: { ru: "Уровень", en: "Level" },
  levelShort: { ru: "ур.", en: "lv." },
  cost: { ru: "Стоимость", en: "Cost" },
  ancient: { ru: "древняя", en: "ancient" },
  researched: { ru: "Изучено", en: "Researched" },
  available: { ru: "Доступно", en: "Available" },
  locked: { ru: "Нужен уровень", en: "Level required" },

  markResearched: { ru: "Отметить изученным", en: "Mark researched" },
  unmark: { ru: "Снять отметку", en: "Unmark" },
  close: { ru: "Закрыть", en: "Close" },

  recipe: { ru: "Рецепт", en: "Recipe" },
  stations: { ru: "Где делается", en: "Crafted at" },
  materials: { ru: "Материалы", en: "Materials" },
  noRecipe: { ru: "Рецепта нет — постройка или набор", en: "No recipe — a structure or a set" },
  unlocks: { ru: "Открывает", en: "Unlocks" },

  requiresBoss: { ru: "Нужна победа над боссом башни", en: "Requires a tower boss" },
  requiresResearch: { ru: "Нужно исследование лаборатории", en: "Requires lab research" },
  requiresTech: { ru: "Нужна технология", en: "Requires technology" },

  chainSynthesised: { ru: "Связь достроена нами", en: "Link reconstructed by us" },
  chainFromGame: { ru: "Связь из данных игры", en: "Link from game data" },
  synthShort: { ru: "достроено", en: "reconstructed" },
  confidenceNote: {
    ru: "В игре у этой технологии нет пререквизитов: цепочка собрана нами и может быть неточной.",
    en: "The game gives this technology no prerequisites: the chain is our reconstruction and may be wrong.",
  },

  parallel: { ru: "Параллельные варианты, не ступени", en: "Parallel options, not tiers" },
  variantsOf: { ru: "Варианты", en: "Variants" },
  ungrouped: { ru: "Вне цепочек", en: "Ungrouped" },

  nothingFound: { ru: "Ничего не найдено", en: "Nothing found" },
  nothingFoundHint: {
    ru: "Измените запрос или снимите фильтры",
    en: "Change the query or clear the filters",
  },

  ofTotal: { ru: "из", en: "of" },
} satisfies Record<string, Localized>

export function t(key: keyof typeof UI, locale: Locale): string {
  return UI[key][locale]
}

const POINT_FORMS = {
  ru: ["очко", "очка", "очков"],
  en: ["point", "points", "points"],
} as const

const ANCIENT_POINT_FORMS = {
  ru: ["древнее очко", "древних очка", "древних очков"],
  en: ["ancient point", "ancient points", "ancient points"],
} as const

/**
 * «1 очков» — так писать нельзя. Русский требует трёх форм, английскому
 * хватает двух, поэтому склонение живёт здесь, а не в компонентах.
 */
export function pointsLabel(count: number, locale: Locale, ancient: boolean): string {
  const forms = ancient ? ANCIENT_POINT_FORMS[locale] : POINT_FORMS[locale]
  if (locale === "en") return count === 1 ? forms[0] : forms[1]

  const tail = Math.abs(count) % 100
  const last = tail % 10
  if (tail > 10 && tail < 20) return forms[2]
  if (last === 1) return forms[0]
  if (last >= 2 && last <= 4) return forms[1]
  return forms[2]
}
