import { useMemo } from "react"
import { StarIcon, XIcon } from "lucide-react"

import { MaterialList } from "@/components/tree/MaterialList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { TechData } from "@/lib/data"
import { iconUrl } from "@/lib/data"
import { t } from "@/lib/i18n"
import { sumMaterials } from "@/lib/planner"
import type { Locale, Technology } from "@/types/tech"

interface FavoritesSheetProps {
  open: boolean
  /** Уже разрешённые в технологии и отсортированные: отбор живёт в App. */
  techs: Technology[]
  data: TechData
  locale: Locale
  researched: ReadonlySet<string>
  onOpenChange: (open: boolean) => void
  onSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
}

/**
 * Личный список на крафт. В отличие от маршрута, который отвечает «что изучить
 * до цели», здесь лежит то, что игрок сам отметил, — и материалы считаются по
 * всему списку, включая изученное: исследование стоит очков, а материалы
 * нужны на сам предмет и после него.
 */
export function FavoritesSheet({
  open,
  techs,
  data,
  locale,
  researched,
  onOpenChange,
  onSelect,
  onToggleFavorite,
}: FavoritesSheetProps) {
  const materials = useMemo(
    () => sumMaterials(techs.map((tech) => tech.id), data),
    [techs, data],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto" showCloseButton={false}>
        {/* Своя кнопка вместо штатной: та 28 px и подписана по-английски. */}
        <SheetClose
          render={
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 size-11">
              <XIcon />
            </Button>
          }
          aria-label={t("close", locale)}
        />
        <SheetHeader className="pr-12">
          <SheetTitle className="flex items-center gap-2">
            <StarIcon className="size-4 text-favorite" fill="currentColor" />
            {t("favorites", locale)}
            {techs.length > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {techs.length}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">{t("favorites", locale)}</SheetDescription>
        </SheetHeader>

        {techs.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>{t("favoritesEmpty", locale)}</EmptyTitle>
              <EmptyDescription>{t("favoritesEmptyHint", locale)}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="px-4 pb-6">
            <ul className="flex flex-col gap-0.5">
              {techs.map((tech) => (
                <li key={tech.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect(tech.id)}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-left hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <img
                      src={iconUrl(tech.id)}
                      alt=""
                      width={24}
                      height={24}
                      fetchPriority="high"
                      className="size-6 shrink-0 object-contain"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs">{tech.name[locale]}</span>
                    {/* Без этой отметки сводка материалов рядом со списком,
                        половина которого уже пройдена, читается как ошибка. */}
                    {researched.has(tech.id) && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {t("researched", locale)}
                      </Badge>
                    )}
                    <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                      {t("levelShort", locale)} {tech.level}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(tech.id)}
                    aria-label={t("favoriteRemove", locale)}
                    title={t("favoriteRemove", locale)}
                    className="grid size-11 shrink-0 place-items-center rounded-md text-favorite hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <StarIcon className="size-4" fill="currentColor" />
                  </button>
                </li>
              ))}
            </ul>

            {materials.length > 0 && (
              <>
                <Separator className="my-4" />
                <section>
                  <h3 className="mb-1 text-xs font-medium">{t("favoritesMaterials", locale)}</h3>
                  <p className="mb-1 text-[10px] text-muted-foreground">
                    {t("routeMaterialsHint", locale)}
                  </p>
                  <MaterialList materials={materials} locale={locale} />
                </section>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
