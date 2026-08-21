import { useState } from "react"
import { CircleMinusIcon, MoonIcon, SparklesIcon, StarIcon, XIcon } from "lucide-react"

import { ElementIcon } from "@/components/pals/ElementIcon"
import { WorkIcon } from "@/components/pals/WorkIcon"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { dropIconUrl } from "@/lib/dropData"
import { palIconUrl } from "@/lib/palData"
import { t } from "@/lib/i18n"
import { buffGroupOf } from "@/lib/pals"
import { dropQtyLabel, sortedSources } from "@/lib/drops"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"
import {
  WORK_ORDER,
  type ElementNames,
  type Pal,
  type PalSize,
  type PassiveInfo,
  type WorkKey,
  type WorkNames,
} from "@/types/pal"
import type { RanchFile } from "@/types/ranch"

type UiKey = Parameters<typeof t>[0]

const SIZE_LABEL: Record<PalSize, UiKey> = {
  XS: "palSizeXS",
  S: "palSizeS",
  M: "palSizeM",
  L: "palSizeL",
  XL: "palSizeXL",
}

interface PalSheetProps {
  pal: Pal | null
  locale: Locale
  names: WorkNames
  elements: ElementNames
  passives: Record<string, PassiveInfo>
  /** Верх шкалы работ — из данных, как и в фильтре. */
  maxLevel: number
  /** Продукция фермы: показывается блоком у палов с работой «Фермерство». */
  ranch: RanchFile | null
  favorite: boolean
  onToggleFavorite: (id: string) => void
  onClose: () => void
}

/**
 * Карточка пала: то, что в строке списка урезано, — описание целиком, работы
 * со шкалой, полный текст усилителя. Выезжает справа тем же жестом, что
 * панель деталей технологии.
 */
export function PalSheet({
  pal: activePal,
  locale,
  names,
  elements,
  passives,
  maxLevel,
  ranch,
  favorite,
  onToggleFavorite,
  onClose,
}: PalSheetProps) {
  // Лист живёт смонтированным и хранит последнего показанного пала: если
  // рендерить его только при выборе, base-ui не успевает проиграть ни
  // входную, ни выездную анимацию — лист просто мигает.
  const [lastPal, setLastPal] = useState(activePal)
  if (activePal && activePal !== lastPal) setLastPal(activePal)
  const pal = activePal ?? lastPal

  if (!pal) return null

  const owned = WORK_ORDER.filter((key: WorkKey) => pal.work[key])
  const farmProducts = sortedSources(
    (ranch?.producers.find((producer) => producer.palId === pal.id)?.products ?? []).map(
      (product) => ({ ...product, palId: pal.id }),
    ),
  )

  return (
    <Sheet open={activePal !== null} onOpenChange={(open) => !open && onClose()}>
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
          <div className="flex items-start gap-4">
            <img
              src={palIconUrl(pal.id)}
              alt=""
              width={72}
              height={72}
              fetchPriority="high"
              decoding="async"
              className="size-18 shrink-0 rounded-full border object-contain"
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden"
              }}
            />
            <div className="flex min-w-0 flex-col gap-2">
              <SheetTitle className="flex items-baseline gap-2">
                {pal.name[locale]}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  #{pal.dexNo}
                  {pal.dexSuffix}
                </span>
              </SheetTitle>
              <SheetDescription className="sr-only">{pal.name[locale]}</SheetDescription>
              <span className="flex flex-wrap gap-1.5">
                {pal.elements.map((key) => (
                  <span
                    key={key}
                    className="flex items-center gap-1.5 rounded-full border bg-muted/50 py-0.5 pr-2.5 pl-1.5 text-xs"
                  >
                    <ElementIcon element={key} className="size-4" />
                    {elements[key][locale]}
                  </span>
                ))}
                {pal.nocturnal && (
                  <span className="flex items-center gap-1.5 rounded-full border border-synth/40 bg-synth-surface py-0.5 pr-2.5 pl-1.5 text-xs">
                    <MoonIcon className="size-3.5 text-synth" />
                    {t("palNightShort", locale)}
                  </span>
                )}
              </span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="grid grid-cols-3 gap-2">
            <span className="flex flex-col gap-0.5 rounded-lg border bg-card px-2.5 py-2">
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                {t("palFilterFood", locale)}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {pal.food} <span className="text-xs font-normal text-muted-foreground">{t("ofTotal", locale)} 9</span>
              </span>
              <span className="flex gap-px" aria-hidden>
                {Array.from({ length: 9 }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-2 w-1 rounded-[2px]",
                      index < pal.food ? "bg-muted-foreground" : "bg-border",
                    )}
                  />
                ))}
              </span>
            </span>
            <span className="flex flex-col gap-0.5 rounded-lg border bg-card px-2.5 py-2">
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                {t("palSize", locale)}
              </span>
              <span className="text-sm font-medium">{pal.size}</span>
              <span className="text-xs text-muted-foreground">
                {t(SIZE_LABEL[pal.size], locale)}
              </span>
            </span>
            <span className="flex flex-col gap-0.5 rounded-lg border bg-card px-2.5 py-2">
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                {t("palTransport", locale)}
              </span>
              <span className="text-sm font-medium tabular-nums">{pal.transportSpeed}</span>
              <span className="text-xs text-muted-foreground">{t("palSpeedUnit", locale)}</span>
            </span>
          </div>

          <Button
            variant="outline"
            className={cn("h-11", favorite && "border-favorite/60 text-favorite-foreground")}
            onClick={() => onToggleFavorite(pal.id)}
          >
            <StarIcon fill={favorite ? "currentColor" : "none"} />
            {t(favorite ? "favoriteRemove" : "favoriteAdd", locale)}
          </Button>

          {pal.description[locale] && (
            <p className="text-sm text-muted-foreground">{pal.description[locale]}</p>
          )}

          <Separator />

          <section className="flex flex-col gap-2.5">
            <h3 className="text-xs font-medium">{t("palFilterWorks", locale)}</h3>
            {owned.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("palNoWorkLong", locale)}</p>
            )}
            {owned.map((key) => {
              const level = pal.work[key] ?? 0
              return (
                <span key={key} className="flex items-center gap-2.5">
                  <WorkIcon work={key} />
                  <span className="min-w-0 flex-1 truncate text-sm">{names[key][locale]}</span>
                  <span className="flex gap-[3px]" aria-hidden>
                    {Array.from({ length: maxLevel }, (_, index) => (
                      <span
                        key={index}
                        className={cn(
                          "size-3.5 rounded-[4px]",
                          index < level ? "bg-primary" : "bg-border",
                        )}
                      />
                    ))}
                  </span>
                  <span className="w-4 text-right font-mono text-sm font-medium tabular-nums">
                    {level}
                  </span>
                </span>
              )
            })}
          </section>

          {farmProducts.length > 0 && (
            <>
              <Separator />
              <section className="flex flex-col gap-2 rounded-lg border border-researched/50 bg-researched-surface px-3 py-2.5">
                <h3 className="flex items-center gap-2 text-xs font-medium text-researched">
                  <WorkIcon work="MonsterFarm" title="" className="size-5" />
                  {t("palFarmTitle", locale)}
                </h3>
                {farmProducts.map((product) => (
                  <span key={product.itemId} className="flex items-center gap-2.5">
                    <img
                      src={dropIconUrl(product.itemId)}
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className="size-7 shrink-0 rounded-md border bg-card object-contain p-0.5"
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden"
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {ranch?.items[product.itemId]?.name[locale] ?? product.itemId}
                    </span>
                    {product.unlockLevel > 1 && (
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                        {t("ranchUnlockLabel", locale)} {product.unlockLevel}
                      </span>
                    )}
                    {product.rate < 100 && (
                      <span
                        title={`${t("dropChanceTitle", locale)}: ${product.rate}%`}
                        className="shrink-0 rounded-full border border-ancient/40 bg-ancient-surface px-2 py-0.5 text-xs text-ancient-foreground tabular-nums"
                      >
                        {Math.round(product.rate)}%
                      </span>
                    )}
                    <span className="shrink-0 text-right text-sm font-medium tabular-nums">
                      {dropQtyLabel(product)}
                      <span className="block text-[10.5px] font-normal text-muted-foreground">
                        {t("ranchCapLabel", locale)}{" "}
                        {dropQtyLabel({ ...product, min: product.min10, max: product.max10 })}
                      </span>
                    </span>
                  </span>
                ))}
                <p className="text-xs text-muted-foreground">{t("palFarmNote", locale)}</p>
              </section>
            </>
          )}

          {pal.passives.length > 0 && (
            <>
              <Separator />
              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-medium">{t("palFilterBuff", locale)}</h3>
                {pal.passives.map((id) => {
                  const info = passives[id]
                  if (!info) return null
                  const penalty = buffGroupOf(id) === "penalty"
                  return (
                    <div
                      key={id}
                      className={cn(
                        "flex flex-col gap-1 rounded-lg border px-3 py-2.5",
                        penalty
                          ? "border-destructive/40 bg-destructive/10"
                          : "border-researched/50 bg-researched-surface",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {penalty ? (
                          <CircleMinusIcon className="size-4 text-destructive" />
                        ) : (
                          <SparklesIcon className="size-4 text-researched" />
                        )}
                        {info.name[locale]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {info.description[locale]}
                      </span>
                    </div>
                  )
                })}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
