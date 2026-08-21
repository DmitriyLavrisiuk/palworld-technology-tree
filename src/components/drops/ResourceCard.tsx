import { memo } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { dropIconUrl } from "@/lib/dropData"
import { palIconUrl } from "@/lib/palData"
import { palsLabel } from "@/lib/i18n"
import { dropQtyLabel, sortedSources } from "@/lib/drops"
import type { Locale } from "@/types/tech"
import type { DropResource } from "@/types/drop"
import type { Pal } from "@/types/pal"

/** Сколько добытчиков видно на карточке; остальные — «+N» и лист. */
const PREVIEW = 5

interface ResourceCardProps {
  resource: DropResource
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
              {resource.sources.length} {palsLabel(resource.sources.length, locale)}
            </span>
          </span>
        </span>

        <span className="flex gap-1.5">
          {top.map((source) => {
            const pal = palsById.get(source.palId)
            return (
              <Tooltip key={source.palId}>
                <TooltipTrigger
                  render={<span className="flex w-12 flex-col items-center gap-1" />}
                >
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
                  {source.rate < 100 ? ` · ${source.rate}%` : ""}
                </TooltipContent>
              </Tooltip>
            )
          })}
          {rest > 0 && (
            <span className="grid size-11 place-items-center rounded-full border border-dashed text-xs text-muted-foreground tabular-nums">
              +{rest}
            </span>
          )}
        </span>
      </button>
    </li>
  )
})
