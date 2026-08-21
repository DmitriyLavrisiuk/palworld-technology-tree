import { CircleMinusIcon, MoonIcon, SparklesIcon } from "lucide-react"

import { ElementIcon } from "@/components/pals/ElementIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { WorkIcon } from "@/components/pals/WorkIcon"
import { palIconUrl } from "@/lib/palData"
import { t } from "@/lib/i18n"
import { buffGroupOf, type PalFilters } from "@/lib/pals"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"
import {
  WORK_ORDER,
  type ElementNames,
  type Pal,
  type PassiveInfo,
  type WorkKey,
  type WorkNames,
} from "@/types/pal"

interface PalRowProps {
  pal: Pal
  locale: Locale
  names: WorkNames
  elements: ElementNames
  passives: Record<string, PassiveInfo>
  works: PalFilters["works"]
  foodCap: number
}

export function PalRow({ pal, locale, names, elements, passives, works, foodCap }: PalRowProps) {
  /**
   * Выбранные работы идут первыми: среди дюжины значков иначе не видно,
   * за что пал попал в выдачу. Остальные сохраняют игровой порядок.
   */
  const owned = WORK_ORDER.filter((key: WorkKey) => pal.work[key])
  const shown = [...owned].sort((a, b) => Number(works.has(b)) - Number(works.has(a)))

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-2 pr-3">
      <img
        src={palIconUrl(pal.id)}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        decoding="async"
        className="size-12 shrink-0 rounded-full border object-contain"
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden"
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{pal.name[locale]}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            #{pal.dexNo}
            {pal.dexSuffix}
          </span>
          <span className="flex shrink-0 gap-1">
            {pal.elements.map((key) => (
              <Tooltip key={key}>
                <TooltipTrigger
                  render={
                    <span className="grid size-6 place-items-center rounded-full border bg-muted/50" />
                  }
                >
                  <ElementIcon element={key} />
                </TooltipTrigger>
                <TooltipContent>{elements[key][locale]}</TooltipContent>
              </Tooltip>
            ))}
          </span>
          {pal.nocturnal && (
            <span
              title={t("palNocturnal", locale)}
              aria-label={t("palNocturnal", locale)}
              className="shrink-0 text-muted-foreground"
            >
              <MoonIcon className="size-3.5" />
            </span>
          )}
        </span>

        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5" title={`${pal.food} / ${foodCap}`}>
            <span className="flex gap-px" aria-hidden>
              {Array.from({ length: foodCap }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-2 w-1 rounded-[2px]",
                    index < pal.food ? "bg-muted-foreground" : "bg-border",
                  )}
                />
              ))}
            </span>
            <b className="font-medium text-foreground tabular-nums">{pal.food}</b>
            {t("foodPerDay", locale)}
          </span>

          {pal.passives.map((id) => {
            const info = passives[id]
            if (!info) return null
            const penalty = buffGroupOf(id) === "penalty"
            return (
              <span
                key={id}
                title={info.description[locale]}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5",
                  penalty
                    ? "border-destructive/40 bg-destructive/10 text-foreground"
                    : "border-researched/50 bg-researched-surface text-foreground",
                )}
              >
                {penalty ? (
                  <CircleMinusIcon className="size-3 text-destructive" />
                ) : (
                  <SparklesIcon className="size-3 text-researched" />
                )}
                {info.name[locale]}
              </span>
            )
          })}
        </span>

        {pal.description[locale] && (
          <span
            className="line-clamp-1 max-w-[64ch] text-xs text-muted-foreground/80"
            title={pal.description[locale]}
          >
            {pal.description[locale]}
          </span>
        )}
      </div>

      <ul className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1">
        {shown.map((key) => (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <li
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-1.5 py-1 font-mono text-xs tabular-nums",
                    works.has(key)
                      ? "border-ring bg-accent font-medium text-foreground"
                      : "border-transparent text-muted-foreground",
                  )}
                />
              }
            >
              <WorkIcon work={key} />
              {pal.work[key]}
            </TooltipTrigger>
            <TooltipContent>
              {names[key][locale]} · {pal.work[key]}
            </TooltipContent>
          </Tooltip>
        ))}
      </ul>
    </li>
  )
}
