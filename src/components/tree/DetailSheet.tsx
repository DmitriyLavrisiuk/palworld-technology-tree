import { CheckIcon, RouteIcon, SparklesIcon, StarIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { MaterialList } from "@/components/tree/MaterialList"
import { StationList } from "@/components/tree/StationList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { TechData } from "@/lib/data"
import { iconUrl } from "@/lib/data"
import { pointsLabel, t } from "@/lib/i18n"
import { isSynthesised, nodeStatus } from "@/lib/tree"
import { cn } from "@/lib/utils"
import type { Locale, Technology } from "@/types/tech"

interface DetailSheetProps {
  tech: Technology | null
  data: TechData
  locale: Locale
  researched: ReadonlySet<string>
  favorites: ReadonlySet<string>
  playerLevel: number
  onClose: () => void
  onToggleResearched: (id: string) => void
  onToggleFavorite: (id: string) => void
  onPlanRoute: (id: string) => void
}

/** Панель деталей: что это, чем гейтится, из чего делается и насколько мы уверены в цепочке. */
export function DetailSheet({
  tech,
  data,
  locale,
  researched,
  favorites,
  playerLevel,
  onClose,
  onToggleResearched,
  onToggleFavorite,
  onPlanRoute,
}: DetailSheetProps) {
  if (!tech) return null

  const status = nodeStatus(tech, researched, playerLevel)
  const isDone = status === "researched"
  const isFavorite = favorites.has(tech.id)
  const recipe = data.recipes.get(tech.id)
  const chain = data.chainOf.get(tech.id)
  const requires = tech.reqTech ? data.byId.get(tech.reqTech) : null

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
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
        <SheetHeader className="pr-12">
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

          <div className="flex flex-col gap-2">
            <Button
              variant={isDone ? "outline" : "default"}
              className="h-11"
              onClick={() => onToggleResearched(tech.id)}
            >
              {isDone ? null : <CheckIcon />}
              {t(isDone ? "unmark" : "markResearched", locale)}
            </Button>
            <Button
              variant="outline"
              className={cn("h-11", isFavorite && "border-favorite/60 text-favorite-foreground")}
              onClick={() => onToggleFavorite(tech.id)}
            >
              <StarIcon fill={isFavorite ? "currentColor" : "none"} />
              {t(isFavorite ? "favoriteRemove" : "favoriteAdd", locale)}
            </Button>
            <Button variant="outline" className="h-11" onClick={() => onPlanRoute(tech.id)}>
              <RouteIcon />
              {t("planRoute", locale)}
            </Button>
          </div>

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
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">{t("stations", locale)}</p>
                    <StationList stations={recipe.stations} locale={locale} />
                  </div>
                )}
                <MaterialList materials={recipe.materials} locale={locale} className="mt-1" />
              </>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
