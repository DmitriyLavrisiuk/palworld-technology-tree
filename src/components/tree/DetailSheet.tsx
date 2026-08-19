import { CheckIcon, SparklesIcon, TriangleAlertIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { TechData } from "@/lib/data"
import { iconUrl } from "@/lib/data"
import { pointsLabel, t } from "@/lib/i18n"
import { isSynthesised, nodeStatus } from "@/lib/tree"
import type { Locale, Technology } from "@/types/tech"

interface DetailSheetProps {
  tech: Technology | null
  data: TechData
  locale: Locale
  researched: ReadonlySet<string>
  playerLevel: number
  onClose: () => void
  onToggleResearched: (id: string) => void
}

/** Панель деталей: что это, чем гейтится, из чего делается и насколько мы уверены в цепочке. */
export function DetailSheet({
  tech,
  data,
  locale,
  researched,
  playerLevel,
  onClose,
  onToggleResearched,
}: DetailSheetProps) {
  if (!tech) return null

  const status = nodeStatus(tech, researched, playerLevel)
  const isDone = status === "researched"
  const recipe = data.recipes.get(tech.id)
  const chain = data.chainOf.get(tech.id)
  const requires = tech.reqTech ? data.byId.get(tech.reqTech) : null

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="gap-0 overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <img
              src={iconUrl(tech.id)}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <SheetTitle className="text-base leading-tight">{tech.name[locale]}</SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="tabular-nums">
                  {t("levelShort", locale)} {tech.level}
                </Badge>
                <Badge variant={tech.ancient ? "default" : "secondary"} className="tabular-nums">
                  {tech.ancient && <SparklesIcon className="size-3" />}
                  {tech.cost} {pointsLabel(tech.cost, locale, tech.ancient)}
                </Badge>
                <Badge variant="outline">
                  {t(isDone ? "researched" : status === "available" ? "available" : "locked", locale)}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {tech.description[locale] && (
            <p className="text-sm text-muted-foreground">{tech.description[locale]}</p>
          )}

          <Button
            variant={isDone ? "outline" : "default"}
            onClick={() => onToggleResearched(tech.id)}
          >
            {isDone ? null : <CheckIcon />}
            {t(isDone ? "unmark" : "markResearched", locale)}
          </Button>

          {chain && isSynthesised(chain.confidence) && (
            <div className="flex gap-2 rounded-md border border-synth/40 bg-synth-surface p-3 text-xs">
              <TriangleAlertIcon className="mt-px size-4 shrink-0 text-synth" />
              <p>{t("confidenceNote", locale)}</p>
            </div>
          )}

          {(tech.reqBoss || tech.reqResearch || requires) && (
            <div className="flex flex-col gap-1 text-sm">
              {requires && (
                <p>
                  <span className="text-muted-foreground">{t("requiresTech", locale)}: </span>
                  {requires.name[locale]}
                </p>
              )}
              {tech.reqBoss && <p className="text-muted-foreground">{t("requiresBoss", locale)}</p>}
              {tech.reqResearch && (
                <p className="text-muted-foreground">{t("requiresResearch", locale)}</p>
              )}
            </div>
          )}

          <Separator />

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("recipe", locale)}</h3>
            {!recipe ? (
              <p className="text-sm text-muted-foreground">{t("noRecipe", locale)}</p>
            ) : (
              <>
                {recipe.stations.length > 0 && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("stations", locale)}: </span>
                    {recipe.stations.map((station) => station[locale]).join(", ")}
                  </p>
                )}
                <ul className="flex flex-col gap-1">
                  {recipe.materials.map((material) => (
                    <li key={material.id} className="flex justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">{material.name[locale]}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {material.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
