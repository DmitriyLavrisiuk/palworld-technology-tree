import { RangeCells } from "@/components/pals/RangeCells"
import { WorkIcon } from "@/components/pals/WorkIcon"
import { t } from "@/lib/i18n"
import type { Range } from "@/lib/pals"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"
import type { WorkKey, WorkNames } from "@/types/pal"

interface WorkFilterProps {
  locale: Locale
  names: WorkNames
  /** Только те работы, которыми кто-то владеет: остальные дали бы пустоту. */
  works: WorkKey[]
  /** Выбранные работы; `null` — «умеет, уровень любой». */
  selected: ReadonlyMap<WorkKey, Range | null>
  maxLevel: number
  onToggle: (key: WorkKey) => void
  onRange: (key: WorkKey, range: Range | null) => void
}

/** Панель выбора работ с диапазоном уровня. */
export function WorkFilter({
  locale,
  names,
  works,
  selected,
  maxLevel,
  onToggle,
  onRange,
}: WorkFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{t("workFilterHint", locale)}</p>
      <ul className="grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
        {works.map((key) => {
          const active = selected.has(key)
          const range = selected.get(key) ?? null

          return (
            <li
              key={key}
              className={cn(
                "flex flex-col gap-1 rounded-md px-2 py-1",
                active && "bg-accent",
              )}
            >
              <button
                type="button"
                onClick={() => onToggle(key)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-9 min-w-0 flex-1 items-center gap-2 text-left text-sm transition-colors pointer-coarse:min-h-11",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  active ? "font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <WorkIcon work={key} title={names[key][locale]} />
                <span className="min-w-0 flex-1 truncate">{names[key][locale]}</span>
              </button>
              {active && (
                // Ряд стоит под названием, а не рядом: в узкой колонке меню он
                // вытеснял бы подпись работы в ноль.
                <span className="pl-7">
                  <RangeCells
                    cap={maxLevel}
                    range={range}
                    label={names[key][locale]}
                    onChange={(next) => onRange(key, next)}
                  />
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
