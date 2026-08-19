import {
  LaptopIcon,
  LayoutGridIcon,
  MoonIcon,
  NetworkIcon,
  Rows3Icon,
  RulerIcon,
  SearchIcon,
  SparklesIcon,
  SunIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import type { Theme, ViewMode } from "@/hooks/useProgress"
import { MAX_LEVEL } from "@/lib/constants"
import { t } from "@/lib/i18n"
import type { Filters, ResearchedTotals } from "@/lib/tree"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"

type UiKey = Parameters<typeof t>[0]

/**
 * Высота элементов управления: 36 px мышью, 44 px пальцем. Правило про цели
 * касания говорит «у всего, что нажимается пальцем», поэтому граница проведена
 * по типу указателя, а не по ширине экрана: у сенсорного ноутбука палец такой
 * же толстый, как у телефона.
 */
const CONTROL = "h-9 pointer-coarse:h-11"

const VIEWS: { value: ViewMode; label: UiKey; icon: typeof Rows3Icon }[] = [
  { value: "lanes", label: "viewLanes", icon: Rows3Icon },
  { value: "levels", label: "viewLevels", icon: RulerIcon },
  { value: "compact", label: "viewCompact", icon: LayoutGridIcon },
]

const FILTERS: { key: keyof Filters; label: UiKey; short: UiKey }[] = [
  { key: "availableOnly", label: "filterAvailable", short: "filterAvailableShort" },
  { key: "ancientOnly", label: "filterAncient", short: "filterAncientShort" },
  { key: "hideResearched", label: "filterHideDone", short: "filterHideDoneShort" },
]

const LEGEND: { label: UiKey; className: string }[] = [
  { label: "legendResearched", className: "bg-researched" },
  { label: "legendAncient", className: "bg-ancient" },
  { label: "legendRoute", className: "bg-route" },
  { label: "legendSynth", className: "bg-synth" },
  { label: "legendLocked", className: "bg-muted-foreground/60" },
]

const THEME_ORDER: Theme[] = ["system", "light", "dark"]
const THEME_ICON = { system: LaptopIcon, light: SunIcon, dark: MoonIcon }
const THEME_LABEL = { system: "themeSystem", light: "themeLight", dark: "themeDark" } as const

interface ToolbarProps {
  locale: Locale
  view: ViewMode
  theme: Theme
  level: number
  query: string
  filters: Filters
  shown: number
  total: number
  totals: ResearchedTotals
  onQuery: (value: string) => void
  onView: (view: ViewMode) => void
  onLevel: (level: number) => void
  onLocale: (locale: Locale) => void
  onTheme: (theme: Theme) => void
  onFilters: (filters: Filters) => void
}

export function Toolbar({
  locale,
  view,
  theme,
  level,
  query,
  filters,
  shown,
  total,
  totals,
  onQuery,
  onView,
  onLevel,
  onLocale,
  onTheme,
  onFilters,
}: ToolbarProps) {
  const ThemeIcon = THEME_ICON[theme]
  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
        {/* На узком экране заголовок съедает целую строку шапки, а название
            приложения и так стоит во вкладке браузера. */}
        <span className="hidden shrink-0 items-center gap-2 sm:flex">
          <NetworkIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("appShort", locale)}</span>
          <Badge variant="secondary" className="tabular-nums">
            {shown}
          </Badge>
        </span>

        <InputGroup className={cn(CONTROL, "w-full min-w-48 sm:w-72 sm:flex-none")}>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            className={CONTROL}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={t("search", locale)}
            aria-label={t("search", locale)}
          />
        </InputGroup>

        <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {t("myLevel", locale)}
          <input
            type="number"
            min={1}
            max={MAX_LEVEL}
            value={level}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (event.target.value !== "" && Number.isFinite(next)) onLevel(next)
            }}
            aria-label={t("myLevel", locale)}
            className={cn(
              CONTROL,
              "w-16 rounded-md border bg-transparent px-2 text-center text-sm text-foreground tabular-nums",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            )}
          />
        </label>

        <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            {t("statResearched", locale)}{" "}
            <span className="font-medium text-foreground tabular-nums">{totals.count}</span> /{" "}
            <span className="tabular-nums">{total}</span>
          </span>
          <span className="hidden items-center gap-1 md:inline-flex">
            {t("statPoints", locale)}{" "}
            <span className="font-medium text-foreground tabular-nums">{totals.techPoints}</span>
            {totals.ancientPoints > 0 && (
              <span className="inline-flex items-center gap-0.5 text-ancient-foreground tabular-nums">
                <SparklesIcon className="size-3" />
                {totals.ancientPoints}
              </span>
            )}
          </span>
        </span>

        <span className={cn(CONTROL, "flex shrink-0 items-center rounded-lg bg-muted p-0.5")}>
          {(["ru", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onLocale(code)}
              aria-pressed={locale === code}
              className={cn(
                "grid h-full w-9 place-items-center rounded-md font-mono text-xs transition-colors",
                locale === code
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </span>

        <button
          type="button"
          title={t(THEME_LABEL[theme], locale)}
          aria-label={t(THEME_LABEL[theme], locale)}
          onClick={() => onTheme(nextTheme)}
          className={cn(
            CONTROL,
            "grid aspect-square shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
        >
          <ThemeIcon className="size-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-3 py-2">
        <span className={cn(CONTROL, "flex shrink-0 items-center rounded-lg bg-muted p-0.5")}>
          {VIEWS.map((item) => {
            const Icon = item.icon
            const active = view === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onView(item.value)}
                aria-pressed={active}
                className={cn(
                  "flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs whitespace-nowrap transition-colors sm:px-3",
                  active
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {t(item.label, locale)}
              </button>
            )
          })}
        </span>

        <span className="flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => {
            const active = filters[item.key]
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onFilters({ ...filters, [item.key]: !active })}
                aria-pressed={active}
                className={cn(
                  CONTROL,
                  "rounded-full border px-3.5 text-xs whitespace-nowrap transition-colors",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="sm:hidden">{t(item.short, locale)}</span>
                <span className="hidden sm:inline">{t(item.label, locale)}</span>
              </button>
            )
          })}
        </span>

        <ul className="ml-auto hidden shrink-0 items-center gap-3 text-xs text-muted-foreground lg:flex">
          {LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span aria-hidden className={cn("size-2 rounded-full", item.className)} />
              {t(item.label, locale)}
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
