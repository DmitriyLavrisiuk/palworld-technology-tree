import { useState } from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { dropIconUrl } from "@/lib/dropData"
import { palIconUrl } from "@/lib/palData"
import { palsLabel, t } from "@/lib/i18n"
import { dropQtyLabel, sortedSources } from "@/lib/drops"
import type { Locale } from "@/types/tech"
import type { DropResource } from "@/types/drop"
import type { Pal } from "@/types/pal"

interface ResourceSheetProps {
  resource: DropResource | null
  locale: Locale
  palsById: ReadonlyMap<string, Pal>
  onClose: () => void
}

/**
 * Лист ресурса: полный список палов-источников, лучшие сверху. Выезжает
 * справа тем же жестом, что карточка пала и панель деталей технологии.
 */
export function ResourceSheet({
  resource: activeResource,
  locale,
  palsById,
  onClose,
}: ResourceSheetProps) {
  // Лист живёт смонтированным и хранит последний показанный ресурс: если
  // рендерить его только при выборе, base-ui не успевает проиграть ни
  // входную, ни выездную анимацию — лист просто мигает.
  const [lastResource, setLastResource] = useState(activeResource)
  if (activeResource && activeResource !== lastResource) setLastResource(activeResource)
  const resource = activeResource ?? lastResource

  if (!resource) return null

  const sources = sortedSources(resource.sources)

  return (
    <Sheet open={activeResource !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="gap-0 overflow-y-auto" showCloseButton={false}>
        {/* Своя кнопка вместо штатной: та 28 px и подписана по-английски. */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 size-11"
          aria-label={t("close", locale)}
          onClick={onClose}
        >
          <XIcon />
        </Button>

        <SheetHeader className="pr-14">
          <div className="flex items-center gap-3">
            <img
              src={dropIconUrl(resource.id)}
              alt=""
              width={44}
              height={44}
              fetchPriority="high"
              decoding="async"
              className="size-11 shrink-0 rounded-md border bg-muted/50 object-contain p-0.5"
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden"
              }}
            />
            <div className="flex min-w-0 flex-col">
              <SheetTitle>{resource.name[locale]}</SheetTitle>
              <SheetDescription>
                {t("dropSheetHint", locale)} · {sources.length}{" "}
                {palsLabel(sources.length, locale)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ul className="flex flex-col px-4 pb-6">
          {sources.map((source) => {
            const pal = palsById.get(source.palId)
            return (
              <li
                key={source.palId}
                className="flex min-h-11 items-center gap-2.5 border-t first:border-t-0"
              >
                <img
                  src={palIconUrl(source.palId)}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  decoding="async"
                  className="size-8 shrink-0 rounded-full border bg-muted/30 object-contain"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden"
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {pal ? pal.name[locale] : source.palId}
                </span>
                {pal && (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    #{pal.dexNo}
                    {pal.dexSuffix}
                  </span>
                )}
                {source.rate < 100 && (
                  <span
                    title={t("dropChanceTitle", locale)}
                    className="shrink-0 rounded-full border border-ancient/40 bg-ancient-surface px-2 py-0.5 text-xs text-ancient-foreground tabular-nums"
                  >
                    {source.rate}%
                  </span>
                )}
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {dropQtyLabel(source)}
                </span>
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
