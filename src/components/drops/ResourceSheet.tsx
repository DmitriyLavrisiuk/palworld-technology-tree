import { useState } from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { WorkIcon } from "@/components/pals/WorkIcon"
import { dropIconUrl } from "@/lib/dropData"
import { palIconUrl } from "@/lib/palData"
import { palsLabel, t } from "@/lib/i18n"
import { dropQtyLabel, sortedSources, type CombinedResource } from "@/lib/drops"
import type { Locale } from "@/types/tech"
import type { Pal } from "@/types/pal"

interface ResourceSheetProps {
  resource: CombinedResource | null
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
  const farm = sortedSources(resource.farm)

  const palRow = (palId: string) => {
    const pal = palsById.get(palId)
    return (
      <>
        <img
          src={palIconUrl(palId)}
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
          {pal ? pal.name[locale] : palId}
        </span>
        {pal && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            #{pal.dexNo}
            {pal.dexSuffix}
          </span>
        )}
      </>
    )
  }

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
                {sources.length > 0 &&
                  `${t("dropSheetHint", locale)} · ${sources.length} ${palsLabel(sources.length, locale)}`}
                {sources.length > 0 && farm.length > 0 && ", "}
                {farm.length > 0 && `${t("dropFarmLabel", locale)} · ${farm.length}`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-6">
          {sources.length > 0 && (
            <section>
              {/* Подписи групп появляются, только когда есть обе механики. */}
              {farm.length > 0 && (
                <h3 className="mb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  {t("dropGroupKill", locale)}
                </h3>
              )}
              <ul className="flex flex-col">
                {sources.map((source) => (
                  <li
                    key={source.palId}
                    className="flex min-h-11 items-center gap-2.5 border-t first:border-t-0"
                  >
                    {palRow(source.palId)}
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
                ))}
              </ul>
            </section>
          )}

          {farm.length > 0 && (
            <section>
              <h3 className="mb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                <WorkIcon work="MonsterFarm" title="" className="size-4" />
                {t("dropGroupFarm", locale)}
              </h3>
              <ul className="flex flex-col">
                {farm.map((source) => (
                  <li
                    key={source.palId}
                    className="flex min-h-11 items-center gap-2.5 border-t py-1 first:border-t-0"
                  >
                    {palRow(source.palId)}
                    {source.unlockLevel > 1 && (
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                        {t("ranchUnlockLabel", locale)} {source.unlockLevel}
                      </span>
                    )}
                    {source.rate < 100 && (
                      <span
                        title={`${t("dropChanceTitle", locale)}: ${source.rate}%`}
                        className="shrink-0 rounded-full border border-ancient/40 bg-ancient-surface px-2 py-0.5 text-xs text-ancient-foreground tabular-nums"
                      >
                        {Math.round(source.rate)}%
                      </span>
                    )}
                    <span className="shrink-0 text-right text-sm font-medium tabular-nums">
                      {dropQtyLabel(source)}
                      <span className="block text-[10.5px] font-normal text-muted-foreground">
                        {t("ranchCapLabel", locale)}{" "}
                        {dropQtyLabel({ ...source, min: source.min10, max: source.max10 })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
