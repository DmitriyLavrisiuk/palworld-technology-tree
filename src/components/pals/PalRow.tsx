import { MoonIcon } from "lucide-react"

import { WorkIcon } from "@/components/pals/WorkIcon"
import { Badge } from "@/components/ui/badge"
import { palIconUrl } from "@/lib/palData"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"
import {
  WORK_ORDER,
  type ElementNames,
  type Pal,
  type WorkKey,
  type WorkNames,
} from "@/types/pal"

interface PalRowProps {
  pal: Pal
  locale: Locale
  names: WorkNames
  elements: ElementNames
  required: ReadonlyMap<WorkKey, number>
}

export function PalRow({ pal, locale, names, elements, required }: PalRowProps) {
  /**
   * Выбранные работы идут первыми: среди тринадцати значков иначе не видно,
   * за что пал попал в выдачу. Остальные сохраняют игровой порядок.
   */
  const owned = WORK_ORDER.filter((key) => pal.work[key])
  const shown = [...owned].sort((a, b) => Number(required.has(b)) - Number(required.has(a)))

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-2">
      <img
        src={palIconUrl(pal.id)}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        decoding="async"
        className="size-12 shrink-0 rounded-full border object-contain"
        // Иконки может не оказаться после патча: пустое место лучше битой картинки.
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden"
        }}
      />

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{pal.name[locale]}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            #{pal.dexNo}
            {pal.dexSuffix}
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
        <span className="truncate text-xs text-muted-foreground">
          {pal.elements.map((key) => elements[key][locale]).join(" · ") || "—"}
        </span>
      </div>

      <ul className="ml-auto flex flex-wrap items-center justify-end gap-1">
        {shown.map((key) => {
          const picked = required.has(key)

          return (
            <li
              key={key}
              title={`${names[key][locale]} ${pal.work[key]}`}
              className={cn(
                "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs tabular-nums",
                picked
                  ? "border-ring bg-accent font-medium"
                  : "border-transparent text-muted-foreground",
              )}
            >
              <WorkIcon work={key} title={names[key][locale]} className="size-3.5" />
              {pal.work[key]}
            </li>
          )
        })}
        {owned.length === 0 && (
          <Badge variant="outline" className="text-[10px]">
            {t("palNoWork", locale)}
          </Badge>
        )}
      </ul>
    </li>
  )
}
