import { memo } from "react"
import { CircleMinusIcon, MoonIcon, SparklesIcon, StarIcon } from "lucide-react"

import { ElementIcon } from "@/components/pals/ElementIcon"
import { WorkIcon } from "@/components/pals/WorkIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { palIconUrl } from "@/lib/palData"
import { t } from "@/lib/i18n"
import { buffGroupOf, type PalFilters } from "@/lib/pals"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"
import type { ElementNames, Pal, PassiveInfo, WorkKey, WorkNames } from "@/types/pal"

interface PalRowProps {
  pal: Pal
  locale: Locale
  names: WorkNames
  elements: ElementNames
  passives: Record<string, PassiveInfo>
  works: PalFilters["works"]
  /** Все работы раздела: у карточки фиксированные слоты, а не только свои. */
  workKeys: WorkKey[]
  foodCap: number
  favorite: boolean
  onSelect: (id: string) => void
}

/**
 * Карточка пала в сетке. Внизу — слоты всех работ раздела в одном и том же
 * порядке у каждой карточки: отсутствующие приглушены, а не спрятаны, поэтому
 * одна и та же работа всегда стоит в одном месте и колонку можно сканировать
 * взглядом сверху вниз.
 */
export const PalRow = memo(function PalRow({
  pal,
  locale,
  names,
  elements,
  passives,
  works,
  workKeys,
  foodCap,
  favorite,
  onSelect,
}: PalRowProps) {
  return (
    // content-visibility: карточки за экраном не раскладываются и не
    // рисуются — на 288 карточках это большая часть кадра.
    <li className="h-full [content-visibility:auto] [contain-intrinsic-size:auto_190px]">
      <button
        type="button"
        onClick={() => onSelect(pal.id)}
        className="flex h-full w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="flex items-center gap-3">
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

          <span className="flex min-w-0 flex-1 flex-col gap-1">
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
                        <span className="grid size-7 place-items-center rounded-full border bg-muted/50" />
                      }
                    >
                      <ElementIcon element={key} className="size-5" />
                    </TooltipTrigger>
                    <TooltipContent>{elements[key][locale]}</TooltipContent>
                  </Tooltip>
                ))}
              </span>
              {favorite && (
                <StarIcon
                  className="ml-auto size-4 shrink-0 fill-current text-favorite"
                  aria-hidden
                />
              )}
              {pal.nocturnal && (
                <Tooltip>
                  <TooltipTrigger render={<span className="shrink-0 text-muted-foreground" />}>
                    <MoonIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>{t("palNocturnal", locale)}</TooltipContent>
                </Tooltip>
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
          </span>
        </span>

        {pal.description[locale] && (
          <span
            className="line-clamp-1 text-xs text-muted-foreground/80"
            title={pal.description[locale]}
          >
            {pal.description[locale]}
          </span>
        )}

        <span
          className="mt-auto grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${workKeys.length}, minmax(0, 1fr))` }}
        >
          {workKeys.map((key) => {
            const level = pal.work[key]
            const picked = works.has(key) && Boolean(level)

            return (
              <Tooltip key={key}>
                <TooltipTrigger
                  render={
                    <span
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-md border py-1",
                        picked ? "border-ring bg-accent" : "border-transparent",
                        !level && "opacity-25",
                      )}
                    />
                  }
                >
                  <WorkIcon work={key} className="size-5" />
                  <span
                    className={cn(
                      "font-mono text-xs leading-none tabular-nums",
                      picked ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {level ?? "·"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {names[key][locale]}
                  {level ? ` · ${level}` : ""}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </span>
      </button>
    </li>
  )
})
