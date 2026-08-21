import { memo } from "react"

import { cn } from "@/lib/utils"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { WorkIcon } from "@/components/pals/WorkIcon"
import { dropIconUrl } from "@/lib/dropData"
import { palIconUrl } from "@/lib/palData"
import { palsLabel, t } from "@/lib/i18n"
import { dropQtyLabel, sortedSources, type CombinedResource, type FarmSource } from "@/lib/drops"
import type { DropSource } from "@/types/drop"
import type { Locale } from "@/types/tech"
import type { Pal } from "@/types/pal"

/** Сколько добытчиков видно на карточке; остальные — «+N» и лист. */
const PREVIEW = 5

interface ResourceCardProps {
  resource: CombinedResource
  locale: Locale
  palsById: ReadonlyMap<string, Pal>
  /** Позиция в выдаче — задаёт задержку каскада появления. */
  index: number
  onSelect: (id: string) => void
}

/**
 * Карточка ресурса: топ добытчиков портретами с количеством за убийство.
 * Карточка одной высоты у всех ресурсов — у кожи 78 источников, и полный
 * список живёт в листе по клику, а не растягивает сетку.
 */
export const ResourceCard = memo(function ResourceCard({
  resource,
  locale,
  palsById,
  index,
  onSelect,
}: ResourceCardProps) {
  const top = sortedSources(resource.sources).slice(0, PREVIEW)
  const rest = resource.sources.length - top.length
  const farm = sortedSources(resource.farm).slice(0, PREVIEW)
  const farmRest = resource.farm.length - farm.length

  const slot = (source: DropSource, pal: Pal | undefined) => (
    <Tooltip key={source.palId}>
      <TooltipTrigger render={<span className="flex w-12 flex-col items-center gap-1" />}>
        <img
          src={palIconUrl(source.palId)}
          alt=""
          width={44}
          height={44}
          loading="lazy"
          decoding="async"
          className="size-11 rounded-full border bg-muted/30 object-contain"
          onError={(event) => {
            event.currentTarget.style.visibility = "hidden"
          }}
        />
        <span className="text-[11px] leading-none text-muted-foreground tabular-nums">
          {dropQtyLabel(source)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {pal ? pal.name[locale] : source.palId}
        {source.rate < 100 ? ` · ${Math.round(source.rate)}%` : ""}
      </TooltipContent>
    </Tooltip>
  )

  return (
    <li
      className="animate-in fade-in-0 slide-in-from-bottom-3 animation-duration-300 fill-mode-both motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <button
        type="button"
        onClick={() => onSelect(resource.id)}
        className="flex w-full flex-col gap-2.5 rounded-lg border bg-card p-3 text-left transition-colors hover:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="flex items-center gap-2.5">
          <img
            src={dropIconUrl(resource.id)}
            alt=""
            width={36}
            height={36}
            loading="lazy"
            decoding="async"
            className="size-9 shrink-0 rounded-md border bg-muted/50 object-contain p-0.5"
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden"
            }}
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{resource.name[locale]}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {resource.sources.length > 0 &&
                `${resource.sources.length} ${palsLabel(resource.sources.length, locale)}`}
              {resource.sources.length > 0 && resource.farm.length > 0 && " · "}
              {resource.farm.length > 0 &&
                `${resource.farm.length} ${t("dropFarmLabel", locale)}`}
            </span>
          </span>
        </span>

        {top.length > 0 && (
          <span className="flex gap-1.5">
            {top.map((source) => slot(source, palsById.get(source.palId)))}
            {rest > 0 && (
              <span className="grid size-11 place-items-center rounded-full border border-dashed text-xs text-muted-foreground tabular-nums">
                +{rest}
              </span>
            )}
          </span>
        )}

        {/* Ряд фермы отделён пунктиром и меткой с игровой иконкой работы:
            верхний ряд — «кого фармить», нижний — «кого поселить». */}
        {farm.length > 0 && (
          <span
            className={cn(
              "flex gap-1.5",
              top.length > 0 && "border-t border-dashed pt-2",
            )}
          >
            <span className="flex w-12 flex-col items-center gap-1 pt-0.5">
              <WorkIcon work="MonsterFarm" title="" className="size-6 rounded-md border border-researched/50 bg-researched-surface p-0.5" />
              <span className="text-[10px] leading-none text-researched">
                {t("dropFarmLabel", locale)}
              </span>
            </span>
            {farm.map((source: FarmSource) => slot(source, palsById.get(source.palId)))}
            {farmRest > 0 && (
              <span className="grid size-11 place-items-center rounded-full border border-dashed text-xs text-muted-foreground tabular-nums">
                +{farmRest}
              </span>
            )}
          </span>
        )}
      </button>
    </li>
  )
})
