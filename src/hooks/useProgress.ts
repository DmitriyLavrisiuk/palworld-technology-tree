import { useCallback, useEffect, useMemo, useState } from "react"

import { MAX_LEVEL } from "@/lib/constants"
import type { Locale } from "@/types/tech"

const STORAGE_KEY = "palworld-technology-tree"

/**
 * Ключ прототипа. Он живёт на том же origin (dmitriylavrisiuk.github.io),
 * поэтому его запись нам видна. Читаем один раз — пока своей записи ещё нет,
 * — чтобы прогресс переехал. Дальше приложения независимы.
 */
const LEGACY_KEY = "palworld-tech-tree"

const SCHEMA_VERSION = 1

export type ViewMode = "levels" | "lanes" | "compact"
export type Theme = "light" | "dark" | "system"

export interface Progress {
  version: number
  researched: string[]
  level: number
  locale: Locale
  view: ViewMode
  theme: Theme
}

const VIEWS: ViewMode[] = ["levels", "lanes", "compact"]
const THEMES: Theme[] = ["light", "dark", "system"]
const LOCALES: Locale[] = ["ru", "en"]

const DEFAULTS: Progress = {
  version: SCHEMA_VERSION,
  researched: [],
  /**
   * Максимальный уровень, а не 1. На первом уровне все 588 узлов серые
   * и страница читается как пустая; сузить до своего уровня — осознанное
   * действие, а не стартовое состояние.
   */
  level: MAX_LEVEL,
  locale: "ru",
  view: "levels",
  theme: "system",
}

/**
 * Разбирает хранимое значение по полям. Любое поле, которое не проходит
 * проверку, откатывается к умолчанию в одиночку: испорченный уровень не
 * должен стоить игроку списка изученного.
 *
 * Когда схема сменится, ветвление по `version` появится здесь — поле для
 * этого и заведено с первого дня.
 */
function coerce(raw: unknown): Progress {
  if (typeof raw !== "object" || raw === null) return DEFAULTS
  const value = raw as Record<string, unknown>

  return {
    version: SCHEMA_VERSION,
    researched: Array.isArray(value.researched)
      ? value.researched.filter((id): id is string => typeof id === "string")
      : DEFAULTS.researched,
    level:
      typeof value.level === "number" && Number.isFinite(value.level)
        ? Math.min(MAX_LEVEL, Math.max(1, Math.round(value.level)))
        : DEFAULTS.level,
    locale: LOCALES.includes(value.locale as Locale)
      ? (value.locale as Locale)
      : DEFAULTS.locale,
    view: VIEWS.includes(value.view as ViewMode) ? (value.view as ViewMode) : DEFAULTS.view,
    theme: THEMES.includes(value.theme as Theme) ? (value.theme as Theme) : DEFAULTS.theme,
  }
}

function read(): Progress {
  try {
    const own = localStorage.getItem(STORAGE_KEY)
    if (own) return coerce(JSON.parse(own))

    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) return coerce(JSON.parse(legacy))

    return DEFAULTS
  } catch {
    // Испорченное или недоступное хранилище не должно ронять приложение.
    return DEFAULTS
  }
}

/**
 * Единственный источник постоянного состояния: отметки изученного, уровень
 * персонажа, язык, режим и тема. Других записей в localStorage в проекте нет.
 */
export function useProgress() {
  const [state, setState] = useState<Progress>(read)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Хранилище переполнено или заблокировано: сессия работает, но не переживёт перезагрузку.
    }
  }, [state])

  const researched = useMemo(() => new Set(state.researched), [state.researched])

  const toggleResearched = useCallback((id: string) => {
    setState((previous) => {
      const next = new Set(previous.researched)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...previous, researched: [...next] }
    })
  }, [])

  const setLevel = useCallback((level: number) => {
    if (!Number.isFinite(level)) return
    setState((previous) => ({
      ...previous,
      level: Math.min(MAX_LEVEL, Math.max(1, Math.round(level))),
    }))
  }, [])

  const setLocale = useCallback((locale: Locale) => {
    setState((previous) => ({ ...previous, locale }))
  }, [])

  const setView = useCallback((view: ViewMode) => {
    setState((previous) => ({ ...previous, view }))
  }, [])

  const setTheme = useCallback((theme: Theme) => {
    setState((previous) => ({ ...previous, theme }))
  }, [])

  return {
    ...state,
    researched,
    toggleResearched,
    setLevel,
    setLocale,
    setView,
    setTheme,
  }
}
