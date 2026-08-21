import { StarIcon, UtensilsIcon } from "lucide-react"

import { ElementIcon } from "@/components/pals/ElementIcon"
import { FilterPopoverContent } from "@/components/FilterPopoverContent"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { RangeCells } from "@/components/pals/RangeCells"
import { WorkFilter } from "@/components/pals/WorkFilter"
import { WorkIcon } from "@/components/pals/WorkIcon"
import { t } from "@/lib/i18n"
import {
  BUFF_GROUP_ORDER,
  type BuffFilterKey,
  type PalFilters,
  type Range,
} from "@/lib/pals"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"
import {
  ELEMENT_ORDER,
  type ElementKey,
  type ElementNames,
  type WorkKey,
  type WorkNames,
} from "@/types/pal"

type UiKey = Parameters<typeof t>[0]

export type PanelKey = "works" | "elements" | "food" | "buff"

const BUFF_LABEL: Record<BuffFilterKey, UiKey> = {
  any: "buffAny",
  element: "buffElement",
  attack: "buffAttack",
  defense: "buffDefense",
  legend: "buffLegend",
  penalty: "buffPenalty",
}

interface PalFilterBarProps {
  locale: Locale
  filters: PalFilters
  workNames: WorkNames
  elementNames: ElementNames
  workKeys: WorkKey[]
  maxLevel: number
  maxFood: number
  /** Сколько палов носит пассивку каждой группы — честные счётчики в панели. */
  buffCounts: ReadonlyMap<BuffFilterKey, number>
  /** Сколько палов в избранном; при нуле пилюля не показывается. */
  favoritesCount: number
  onToggleFavoritesOnly: () => void
  onToggleWork: (key: WorkKey) => void
  onWorkRange: (key: WorkKey, range: Range | null) => void
  onToggleElement: (key: ElementKey) => void
  onFood: (range: Range | null) => void
  onToggleBuff: (key: BuffFilterKey) => void
  onReset: () => void
}

/** Подпись диапазона на пилюле: «2–4», «≥2», «≤4» или одно число. */
function rangeLabel(range: Range | null, cap: number, locale: Locale): string {
  if (!range) return ""
  if (range.min === range.max) return String(range.min)
  if (range.min === 1 && range.max === cap) return t("rangeAny", locale)
  if (range.max === cap) return `≥${range.min}`
  if (range.min === 1) return `≤${range.max}`
  return `${range.min}–${range.max}`
}

const PILL =
  "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap transition-colors " +
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none pointer-coarse:h-11"

/**
 * Ряд пилюль с панелями — та же форма, что фильтры в тулбаре дерева.
 * Активная пилюля залита primary, открытая обведена кольцом.
 */
export function PalFilterBar({
  locale,
  filters,
  workNames,
  elementNames,
  workKeys,
  maxLevel,
  maxFood,
  buffCounts,
  favoritesCount,
  onToggleFavoritesOnly,
  onToggleWork,
  onWorkRange,
  onToggleElement,
  onFood,
  onToggleBuff,
  onReset,
}: PalFilterBarProps) {
  const anyActive =
    filters.works.size > 0 ||
    filters.elements.size > 0 ||
    filters.food !== null ||
    filters.buffs.size > 0 ||
    filters.favoritesOnly

  const pill = (
    active: boolean,
    trigger: React.ReactNode,
    panelClass: string,
    panel: React.ReactNode,
  ) => (
    <Popover>
      <PopoverTrigger
        className={cn(
          PILL,
          active
            ? "border-transparent bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          "aria-expanded:border-ring",
        )}
      >
        {trigger}
      </PopoverTrigger>
      <FilterPopoverContent className={panelClass}>{panel}</FilterPopoverContent>
    </Popover>
  )

  return (
    <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2">
      {pill(
        filters.works.size > 0,
        <>
          <WorkIcon work="Handcraft" title="" className="size-4" />
          {t("palFilterWorks", locale)}
          {filters.works.size > 0 && <span className="tabular-nums">{filters.works.size}</span>}
        </>,
        "w-[28rem] max-w-[calc(100vw-1rem)] p-3",
        <div className="flex max-h-[calc(100dvh-9rem)] flex-col gap-2 overflow-y-auto">
          <WorkFilter
            locale={locale}
            names={workNames}
            works={workKeys}
            selected={filters.works}
            maxLevel={maxLevel}
            onToggle={onToggleWork}
            onRange={onWorkRange}
          />
        </div>,
      )}

      {pill(
        filters.elements.size > 0,
        <>
          <ElementIcon element="Fire" className="size-4" />
          {t("palFilterElements", locale)}
          {filters.elements.size > 0 && (
            <span className="tabular-nums">{filters.elements.size}</span>
          )}
        </>,
        "w-72 p-2",
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t("palFilterElementsHint", locale)}</p>
          <div className="flex flex-wrap gap-1.5">
            {ELEMENT_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onToggleElement(key)}
                aria-pressed={filters.elements.has(key)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full border px-3 text-xs transition-colors pointer-coarse:h-11",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  filters.elements.has(key)
                    ? "border-ring bg-accent font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <ElementIcon element={key} />
                {elementNames[key][locale]}
              </button>
            ))}
          </div>
        </div>,
      )}

      {pill(
        filters.food !== null,
        <>
          <UtensilsIcon className="size-3.5" />
          {t("palFilterFood", locale)}
          {filters.food !== null && (
            <span className="tabular-nums">{rangeLabel(filters.food, maxFood, locale)}</span>
          )}
        </>,
        "w-auto p-3",
        <div className="flex flex-col gap-2">
          <p className="max-w-64 text-xs text-muted-foreground">{t("palFilterFoodHint", locale)}</p>
          <RangeCells
            cap={maxFood}
            range={filters.food}
            label={t("palFilterFood", locale)}
            onChange={onFood}
          />
        </div>,
      )}

      {pill(
        filters.buffs.size > 0,
        <>
          <StarIcon className="size-3.5" />
          {t("palFilterBuff", locale)}
          {filters.buffs.size > 0 && <span className="tabular-nums">{filters.buffs.size}</span>}
        </>,
        "w-72 p-2",
        <div className="flex flex-col gap-1">
          <p className="px-1 text-xs text-muted-foreground">{t("palFilterBuffHint", locale)}</p>
          <ul className="flex flex-col">
            {(["any", ...BUFF_GROUP_ORDER] as BuffFilterKey[]).map((key) => {
              const checked = filters.buffs.has(key)
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => onToggleBuff(key)}
                    aria-pressed={checked}
                    className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none pointer-coarse:min-h-11"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-[4px] border",
                        checked && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {checked && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="size-3"
                        >
                          <path d="m4 12 5 5L20 6" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{t(BUFF_LABEL[key], locale)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {buffCounts.get(key) ?? 0}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>,
      )}

      {/* Появляющийся пункт: пока избранного нет, фильтровать нечем. При
          включённом фильтре виден и с нулём — иначе, сняв последнюю звезду,
          фильтр было бы нечем выключить. */}
      {(favoritesCount > 0 || filters.favoritesOnly) && (
        <button
          type="button"
          onClick={onToggleFavoritesOnly}
          aria-pressed={filters.favoritesOnly}
          className={cn(
            PILL,
            filters.favoritesOnly
              ? "border-transparent bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <StarIcon className="size-3.5" fill="currentColor" />
          {t("favorites", locale)}
          {favoritesCount > 0 && <span className="tabular-nums">{favoritesCount}</span>}
        </button>
      )}

      {anyActive && (
        <button
          type="button"
          onClick={onReset}
          className={cn(PILL, "border-dashed text-muted-foreground hover:text-foreground")}
        >
          {t("workFilterClear", locale)}
        </button>
      )}
    </div>
  )
}
