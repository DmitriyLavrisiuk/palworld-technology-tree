import { LaptopIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Theme, ViewMode } from "@/hooks/useProgress"
import { MAX_LEVEL } from "@/lib/constants"
import { t } from "@/lib/i18n"
import type { Filters } from "@/lib/tree"
import type { Locale } from "@/types/tech"

type UiKey = Parameters<typeof t>[0]

const VIEWS: { value: ViewMode; label: UiKey }[] = [
  { value: "lanes", label: "viewLanes" },
  { value: "levels", label: "viewLevels" },
  { value: "compact", label: "viewCompact" },
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
    <header className="sticky top-0 z-40 flex flex-col gap-2 border-b bg-background/95 p-2 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-40 flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            className="h-11"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={t("search", locale)}
            aria-label={t("search", locale)}
          />
        </InputGroup>

        <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          {t("myLevel", locale)}
          <input
            type="number"
            min={1}
            max={MAX_LEVEL}
            value={level}
            onChange={(event) => {
              // Пустое поле не должно схлопывать уровень в 1: пока не введено
              // число, оставляем прежнее значение, иначе набрать новое нельзя.
              const next = Number(event.target.value)
              if (event.target.value !== "" && Number.isFinite(next)) onLevel(next)
            }}
            aria-label={t("myLevel", locale)}
            className="h-11 w-16 rounded-md border bg-transparent px-2 text-center text-sm tabular-nums focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          />
        </label>

        <Button
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          title={t(THEME_LABEL[theme], locale)}
          aria-label={t(THEME_LABEL[theme], locale)}
          onClick={() => onTheme(nextTheme)}
        >
          <ThemeIcon />
        </Button>

        <Button
          variant="outline"
          className="h-11 w-14 shrink-0 font-mono text-xs"
          aria-label={t("switchLanguage", locale)}
          onClick={() => onLocale(locale === "ru" ? "en" : "ru")}
        >
          {t("localeCode", locale)}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          value={[view]}
          onValueChange={(value: string[]) => value[0] && onView(value[0] as ViewMode)}
          variant="outline"
        >
          {VIEWS.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value} className="h-11 px-3 text-xs">
              {t(item.label, locale)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex flex-wrap items-center gap-1">
          <Toggle
            variant="outline"
            className="h-11 px-3 text-xs"
            pressed={filters.availableOnly}
            onPressedChange={(pressed: boolean) =>
              onFilters({ ...filters, availableOnly: pressed })
            }
          >
            {t("filterAvailable", locale)}
          </Toggle>
          <Toggle
            variant="outline"
            className="h-11 px-3 text-xs"
            pressed={filters.ancientOnly}
            onPressedChange={(pressed: boolean) => onFilters({ ...filters, ancientOnly: pressed })}
          >
            {t("filterAncient", locale)}
          </Toggle>
          <Toggle
            variant="outline"
            className="h-11 px-3 text-xs"
            pressed={filters.hideResearched}
            onPressedChange={(pressed: boolean) =>
              onFilters({ ...filters, hideResearched: pressed })
            }
          >
            {t("filterHideDone", locale)}
          </Toggle>
        </div>

        <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
          {shown} {t("ofTotal", locale)} {total}
        </span>
      </div>
    </header>
  )
}
