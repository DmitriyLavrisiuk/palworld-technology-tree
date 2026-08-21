import type { Locale, Localized } from "@/types/tech"

/** Два языка, один пользователь — словарь выигрывает у i18n-библиотеки. */
export const UI = {
  appName: { ru: "Шпаргалки Palworld", en: "Palworld Cheatsheets" },
  loading: { ru: "Загрузка данных…", en: "Loading data…" },
  loadFailed: { ru: "Не удалось загрузить данные", en: "Failed to load data" },

  search: { ru: "Поиск технологии…", en: "Search technology…" },
  myLevel: { ru: "Мой уровень", en: "My level" },
  /** Имя раздела, а не сайта: сайт теперь шире дерева. */
  appShort: { ru: "Древо технологий", en: "Technology Tree" },
  titleResearch: {
    ru: "Древо технологий — Шпаргалки Palworld",
    en: "Technology Tree — Palworld Cheatsheets",
  },

  sectionsIntro: { ru: "Выберите раздел", en: "Choose a section" },
  sectionResearch: { ru: "Исследования", en: "Research" },
  sectionResearchHint: {
    ru: "Древо технологий: цепочки апгрейдов, путь до нужного предмета и отметки изученного",
    en: "Technology tree: upgrade chains, a route to any target and what you have researched",
  },
  sectionPalSkills: { ru: "Навыки палов", en: "Pal skills" },
  sectionPalSkillsHint: {
    ru: "Кто на какие работы годится: подбор пала под задачи базы",
    en: "Who is good at what: pick a pal for the jobs your base needs",
  },
  sectionBreeding: { ru: "Разведение палов", en: "Pal breeding" },
  sectionBreedingHint: {
    ru: "Пары родителей и кто из них вылупляется",
    en: "Parent pairs and what they hatch into",
  },
  soon: { ru: "Скоро", en: "Soon" },

  titlePalSkills: {
    ru: "Навыки палов — Шпаргалки Palworld",
    en: "Pal Skills — Palworld Cheatsheets",
  },
  workFilterTitle: { ru: "Какие работы нужны", en: "Jobs you need covered" },
  workFilterHint: {
    ru: "Первый клик по цифре — «от», второй — «до». Клик при растянутом диапазоне начинает новый, по единственной выбранной цифре — снимает выбор.",
    en: "First click on a number sets the low end, second sets the high end. A click on a stretched range starts a new one; clicking the only selected number clears it.",
  },
  workFilterClear: { ru: "Сбросить", en: "Clear" },
  palFilterWorks: { ru: "Работы", en: "Jobs" },
  palFilterElements: { ru: "Стихии", en: "Elements" },
  palFilterElementsHint: {
    ru: "Пал подходит, если у него есть хотя бы одна из выбранных стихий",
    en: "A pal matches if it has at least one of the selected elements",
  },
  palFilterFood: { ru: "Еда", en: "Food" },
  palFilterFoodHint: {
    ru: "Сколько ест. Чаще всего нужно «не больше N»: клик по 1, затем по N.",
    en: "How much it eats. Usually you want “at most N”: click 1, then N.",
  },
  palFilterBuff: { ru: "Усилитель", en: "Booster" },
  palFilterBuffHint: {
    ru: "Врождённая пассивка. Штрафные помечены знаком минуса; «любой» их не считает.",
    en: "An innate passive. Penalties carry a minus mark; “any” does not count them.",
  },
  buffAny: { ru: "Любой усилитель", en: "Any booster" },
  buffElement: { ru: "Усиление стихии", en: "Element damage" },
  buffAttack: { ru: "Атака", en: "Attack" },
  buffDefense: { ru: "Защита", en: "Defense" },
  buffLegend: { ru: "«Легенда»", en: "“Legend”" },
  buffPenalty: { ru: "Со штрафом", en: "With a penalty" },
  rangeAny: { ru: "любой", en: "any" },
  palSize: { ru: "Размер", en: "Size" },
  palSizeXS: { ru: "Очень мелкий", en: "Extra small" },
  palSizeS: { ru: "Мелкий", en: "Small" },
  palSizeM: { ru: "Средний", en: "Medium" },
  palSizeL: { ru: "Крупный", en: "Large" },
  palSizeXL: { ru: "Очень крупный", en: "Extra large" },
  palTransport: { ru: "Переноска", en: "Carry" },
  palSpeedUnit: { ru: "скорость", en: "speed" },
  palNightShort: { ru: "ночной", en: "nocturnal" },
  palNoWorkLong: { ru: "Не работает на базе", en: "Does no base work" },
  foodPerDay: { ru: "еды", en: "food" },
  palSearch: { ru: "Поиск пала…", en: "Search pal…" },
  palsFound: { ru: "Найдено", en: "Found" },
  palNocturnal: { ru: "Работает ночью", en: "Nocturnal" },
  palNoWork: { ru: "не работает", en: "no jobs" },
  palsEmpty: { ru: "Никто не подходит", en: "Nobody matches" },
  palsEmptyHint: {
    ru: "Ни один пал не закрывает все выбранные работы на таком уровне — снизьте требование или уберите работу",
    en: "No pal covers every selected job at that level — lower a requirement or drop a job",
  },
  backToSections: { ru: "К разделам", en: "All sections" },
  statResearched: { ru: "Изучено", en: "Researched" },
  statPoints: { ru: "Очки", en: "Points" },

  legendResearched: { ru: "изучено", en: "researched" },
  legendAncient: { ru: "древняя", en: "ancient" },
  legendRoute: { ru: "в маршруте", en: "on route" },
  legendLocked: { ru: "по уровню", en: "level-gated" },
  legendSynth: { ru: "достроено", en: "reconstructed" },
  legendFavorite: { ru: "избранное", en: "favorite" },

  viewLevels: { ru: "Шкала уровней", en: "Level axis" },
  viewLanes: { ru: "Дорожки", en: "Lanes" },
  viewCompact: { ru: "Компактно", en: "Compact" },

  categories: { ru: "Категории", en: "Categories" },
  categoriesAll: { ru: "Показать все", en: "Show all" },
  filterAvailable: { ru: "Только доступные", en: "Available only" },
  filterAncient: { ru: "Только древние", en: "Ancient only" },
  filterHideDone: { ru: "Скрыть изученные", en: "Hide researched" },
  /* Короткие подписи для узкого экрана: полные не влезают в одну строку. */
  filterAvailableShort: { ru: "Доступные", en: "Available" },
  filterAncientShort: { ru: "Древние", en: "Ancient" },
  filterHideDoneShort: { ru: "Без изученных", en: "Not researched" },

  themeLight: { ru: "Светлая тема", en: "Light theme" },
  themeDark: { ru: "Тёмная тема", en: "Dark theme" },
  themeSystem: { ru: "Как в системе", en: "System theme" },

  levelShort: { ru: "ур.", en: "lv." },
  researched: { ru: "Изучено", en: "Researched" },
  available: { ru: "Доступно", en: "Available" },
  locked: { ru: "Нужен уровень", en: "Level required" },

  markResearched: { ru: "Отметить изученным", en: "Mark researched" },
  unmark: { ru: "Снять отметку", en: "Unmark" },
  close: { ru: "Закрыть", en: "Close" },

  planRoute: { ru: "Проложить путь", en: "Plan route" },
  clearRoute: { ru: "Убрать маршрут", en: "Clear route" },
  routeTitle: { ru: "Путь до цели", en: "Route to target" },

  routeNeedLevel: { ru: "нужен уровень", en: "level needed" },
  routeDone: { ru: "Всё изучено", en: "All researched" },
  routeMaterials: { ru: "Материалы на крафт ступеней", en: "Materials to craft the tiers" },
  routeMaterialsHint: {
    ru: "Исследование стоит очков. Материалы нужны, только если крафтить сами предметы.",
    en: "Research costs points. Materials are only needed if you craft the items themselves.",
  },
  routeBlockers: { ru: "Очками не покупается", en: "Points cannot buy this" },
  routeSynthesisedTitle: { ru: "Достроено нами", en: "Our reconstruction" },
  routeSynthesisedNote: {
    ru: "В игре у этих технологий нет пререквизитов — порядок восстановлен нами.",
    en: "The game gives these technologies no prerequisites — the order is our reconstruction.",
  },
  onRoute: { ru: "в маршруте", en: "on route" },

  favorites: { ru: "Избранное", en: "Favorites" },
  favoriteAdd: { ru: "В избранное", en: "Add to favorites" },
  favoriteRemove: { ru: "Убрать из избранного", en: "Remove from favorites" },
  inFavorites: { ru: "в избранном", en: "in favorites" },
  expand: { ru: "Развернуть", en: "Expand" },
  collapse: { ru: "Свернуть", en: "Collapse" },
  switchLanguage: { ru: "Переключить на английский", en: "Switch to Russian" },
  settings: { ru: "Настройки", en: "Settings" },
  settingsLanguage: { ru: "Язык", en: "Language" },
  settingsTheme: { ru: "Тема", en: "Theme" },
  settingsNodeSize: { ru: "Размер иконок", en: "Icon size" },
  sizeS: { ru: "Мелкий", en: "Small" },
  sizeM: { ru: "Средний", en: "Medium" },
  sizeL: { ru: "Обычный", en: "Regular" },
  sizeXl: { ru: "Крупный", en: "Large" },
  sizeXxl: { ru: "Очень крупный", en: "Extra large" },
  localeCode: { ru: "RU", en: "EN" },

  recipe: { ru: "Рецепт", en: "Recipe" },
  stations: { ru: "Где делается", en: "Crafted at" },
  noRecipe: { ru: "Рецепта нет — постройка или набор", en: "No recipe — a structure or a set" },

  requiresBoss: { ru: "Нужна победа над боссом башни", en: "Requires a tower boss" },
  requiresResearch: { ru: "Нужно исследование лаборатории", en: "Requires lab research" },
  requiresTech: { ru: "Нужна технология", en: "Requires technology" },

  chainSynthesised: { ru: "Связь достроена нами", en: "Link reconstructed by us" },
  synthShort: { ru: "достроено", en: "reconstructed" },
  guessedShort: { ru: "догадка", en: "guess" },
  stepsHidden: { ru: "ступени скрыты фильтром", en: "steps hidden by filter" },
  confidenceNote: {
    ru: "В игре у этой технологии нет пререквизитов: цепочка собрана нами и может быть неточной.",
    en: "The game gives this technology no prerequisites: the chain is our reconstruction and may be wrong.",
  },

  parallel: { ru: "Параллельные варианты, не ступени", en: "Parallel options, not tiers" },
  variantsOf: { ru: "варианты того же тира", en: "same-tier variants" },
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

const STEP_FORMS = {
  ru: ["шаг", "шага", "шагов"],
  en: ["step", "steps", "steps"],
} as const

/**
 * «1 очков» и «1 шагов» — так писать нельзя. Русский требует трёх форм,
 * английскому хватает двух, поэтому склонение живёт здесь, а не в компонентах.
 */
function pluralForm(count: number, locale: Locale, forms: readonly string[]): string {
  if (locale === "en") return count === 1 ? forms[0] : forms[1]

  const tail = Math.abs(count) % 100
  const last = tail % 10
  if (tail > 10 && tail < 20) return forms[2]
  if (last === 1) return forms[0]
  if (last >= 2 && last <= 4) return forms[1]
  return forms[2]
}

export function pointsLabel(count: number, locale: Locale, ancient: boolean): string {
  return pluralForm(count, locale, ancient ? ANCIENT_POINT_FORMS[locale] : POINT_FORMS[locale])
}

export function stepsLabel(count: number, locale: Locale): string {
  return pluralForm(count, locale, STEP_FORMS[locale])
}
