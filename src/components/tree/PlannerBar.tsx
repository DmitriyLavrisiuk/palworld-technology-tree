import { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { iconUrl } from "@/lib/data"
import { pointsLabel, t } from "@/lib/i18n"
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
  const [open, setOpen] = useState(false)
  const remaining = route.steps.filter((step) => !step.researched)
  const levelShort = t("levelShort", locale)

  return (
    <aside className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur">
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
                  {remaining.length} {t("routeSteps", locale)}
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
              </>
            )}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label={t(open ? "collapse" : "expand", locale)}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <ChevronDownIcon /> : <ChevronUpIcon />}
        </Button>
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

      {open && (
        <div className="max-h-[45dvh] overflow-y-auto border-t px-2 pt-2 pb-4">
          {route.synthesisedSteps > 0 && (
            <p className="mb-2 flex items-start gap-2 rounded-md border border-synth/40 bg-synth-surface p-2 text-xs">
              <TriangleAlertIcon className="mt-px size-4 shrink-0 text-synth" />
              <span>
                {route.synthesisedSteps} {t("routeSynthesised", locale)}
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
                      <span
                        aria-label={t("chainSynthesised", locale)}
                        title={t("chainSynthesised", locale)}
                        className="size-1.5 shrink-0 rounded-full bg-synth"
                      />
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
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] gap-x-4">
                {route.materials.map((material) => (
                  <li key={material.id} className="flex justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate">{material.name[locale]}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {material.count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </aside>
  )
}
