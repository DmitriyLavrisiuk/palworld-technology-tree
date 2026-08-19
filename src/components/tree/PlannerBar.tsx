import { ChevronUpIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { MaterialList } from "@/components/tree/MaterialList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { iconUrl } from "@/lib/data"
import { pointsLabel, stepsLabel, t } from "@/lib/i18n"
import type { Route } from "@/lib/planner"
import type { Locale } from "@/types/tech"

interface PlannerBarProps {
  route: Route
  locale: Locale
  playerLevel: number
  onSelect: (id: string) => void
  onClear: () => void
}

/**
 * Нижняя панель маршрута. Свёрнута по умолчанию: на телефоне развёрнутая
 * панель закрывала бы половину дерева, а первая строка отвечает на главный
 * вопрос — сколько очков и какой уровень.
 */
export function PlannerBar({ route, locale, playerLevel, onSelect, onClear }: PlannerBarProps) {
  const remaining = route.steps.filter((step) => !step.researched)
  const levelShort = t("levelShort", locale)

  const bar = (
    // Тень направлена ВВЕРХ: панель прижата к низу, и обычный shadow-lg
    // ушёл бы за край экрана — отделять её от дерева было бы нечем.
    <aside className="sticky bottom-0 z-40 border-t bg-background/95 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.45)] backdrop-blur">
      <div className="flex items-center gap-2 p-2">
        <img
          src={iconUrl(route.target.id)}
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 object-contain"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{route.target.name[locale]}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {remaining.length === 0 ? (
              <span className="text-researched-foreground">{t("routeDone", locale)}</span>
            ) : (
              <>
                <span className="tabular-nums">
                  {remaining.length} {stepsLabel(remaining.length, locale)}
                </span>
                {route.techPoints > 0 && (
                  <span className="tabular-nums">
                    {route.techPoints} {pointsLabel(route.techPoints, locale, false)}
                  </span>
                )}
                {route.ancientPoints > 0 && (
                  <span className="tabular-nums text-ancient-foreground">
                    {route.ancientPoints} {pointsLabel(route.ancientPoints, locale, true)}
                  </span>
                )}
                {route.requiredLevel !== null && (
                  <span
                    className={
                      route.requiredLevel > playerLevel ? "tabular-nums text-route" : "tabular-nums"
                    }
                  >
                    {t("routeNeedLevel", locale)} {route.requiredLevel}
                  </span>
                )}
                {route.synthesisedSteps > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-synth"
                    title={t("routeSynthesisedNote", locale)}
                  >
                    <span aria-hidden className="size-1.5 rounded-full bg-synth" />
                    {t("routeSynthesisedTitle", locale)}: {route.synthesisedSteps}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="size-11 shrink-0">
              <ChevronUpIcon />
            </Button>
          }
          aria-label={t("expand", locale)}
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label={t("clearRoute", locale)}
          onClick={onClear}
        >
          <XIcon />
        </Button>
      </div>

    </aside>
  )

  return (
    <Sheet>
      {bar}

      <SheetContent side="bottom" className="max-h-[75dvh] overflow-y-auto" showCloseButton={false}>
        <SheetHeader className="pr-12">
          <SheetTitle className="truncate">{route.target.name[locale]}</SheetTitle>
          <SheetDescription className="sr-only">{t("routeTitle", locale)}</SheetDescription>
        </SheetHeader>
        <SheetClose
          render={
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 size-11">
              <XIcon />
            </Button>
          }
          aria-label={t("close", locale)}
        />

        <div className="px-4 pb-6">

          {route.synthesisedSteps > 0 && (
            <p className="mb-2 flex items-start gap-2 rounded-md border border-synth/40 bg-synth-surface p-2 text-xs">
              <TriangleAlertIcon className="mt-px size-4 shrink-0 text-synth" />
              <span>
                {t("routeSynthesisedTitle", locale)}: {route.synthesisedSteps}{" "}
                {stepsLabel(route.synthesisedSteps, locale)}. {t("routeSynthesisedNote", locale)}
              </span>
            </p>
          )}

          {route.blockers.length > 0 && (
            <section className="mb-3">
              <h3 className="mb-1 text-xs font-medium">{t("routeBlockers", locale)}</h3>
              <ul className="flex flex-col gap-0.5">
                {route.blockers.map((blocker) => (
                  <li key={blocker.tech.id} className="text-xs text-muted-foreground">
                    {blocker.tech.name[locale]} —{" "}
                    {blocker.boss ? t("requiresBoss", locale) : t("requiresResearch", locale)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mb-3">
            <h3 className="mb-1 text-xs font-medium">{t("routeTitle", locale)}</h3>
            <ol className="flex flex-col gap-0.5">
              {route.steps.map((step, index) => (
                <li key={step.tech.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(step.tech.id)}
                    className="flex min-h-11 w-full items-center gap-2 rounded-md px-1 text-left hover:bg-accent"
                  >
                    <span className="w-5 shrink-0 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <img
                      src={iconUrl(step.tech.id)}
                      alt=""
                      width={24}
                      height={24}
                      loading="lazy"
                      className="size-6 shrink-0 object-contain"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs">
                      {step.tech.name[locale]}
                    </span>
                    {step.source === "chain" && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-synth">
                        <span aria-hidden className="size-1.5 rounded-full bg-synth" />
                        {t("synthShort", locale)}
                      </span>
                    )}
                    <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                      {levelShort} {step.tech.level}
                    </span>
                    {step.researched && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {t("researched", locale)}
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {route.materials.length > 0 && (
            <section>
    <h3 className="mb-1 text-xs font-medium">{t("routeMaterials", locale)}</h3>
              <p className="mb-1 text-[10px] text-muted-foreground">
                {t("routeMaterialsHint", locale)}
              </p>
              <MaterialList materials={route.materials} locale={locale} />
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}