import type { Locale, Localized } from "@/types/tech"

/** Два языка, один пользователь — словарь выигрывает у i18n-библиотеки. */
export const UI = {
  appName: { ru: "Древо технологий Palworld", en: "Palworld Technology Tree" },
  loading: { ru: "Загрузка данных…", en: "Loading data…" },
  loadFailed: { ru: "Не удалось загрузить данные", en: "Failed to load data" },
  technologies: { ru: "технологий", en: "technologies" },
  chains: { ru: "цепочек", en: "chains" },
  recipes: { ru: "рецептов", en: "recipes" },
  levelShort: { ru: "ур.", en: "lv." },
  ancient: { ru: "древняя", en: "ancient" },
} satisfies Record<string, Localized>

export function t(key: keyof typeof UI, locale: Locale): string {
  return UI[key][locale]
}
