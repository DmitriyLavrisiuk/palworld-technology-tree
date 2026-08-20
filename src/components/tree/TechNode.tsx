import { CheckIcon, LockIcon, RouteIcon, SparklesIcon, StarIcon } from "lucide-react"

import { iconUrl } from "@/lib/data"
import { t } from "@/lib/i18n"
import { isGuessed, isSynthesised, type NodeStatus } from "@/lib/tree"
import { cn } from "@/lib/utils"
import type { ChainConfidence, Locale, Technology } from "@/types/tech"

interface TechNodeProps {
  tech: Technology
  locale: Locale
  status: NodeStatus
  selected: boolean
  /** Узел входит в проложенный маршрут. */
  onRoute?: boolean
  /** Узел отмечен звездой. Отметка снимается в деталях и в списке избранного. */
  favorite?: boolean
  /**
   * Достоверность цепочки узла; `null` — узел вне цепочек. Именно тип, а не
   * булев флаг: забыть пометку, передав `false`, больше не получится незаметно.
   */
  confidence: ChainConfidence | null
  showLabel?: boolean
  onSelect: (id: string) => void
}

/**
 * Состояние узла передаётся тремя независимыми каналами сразу — поверхностью,
 * рамкой и значком, — чтобы плитка читалась и без подписи, и в тёмной теме,
 * и при дальтонизме. Цвет в одиночку не несёт ни одного смысла.
 *
 * Размер приходит переменной `--node` с контейнера, а не пропом: до этого он
 * жил шестью разными литералами и успел разъехаться между режимами. Вся
 * мелочь считается в `em` от `--node-text`, поэтому бейджи не становятся
 * игрушечными на крупной плитке и не заедают на мелкой.
 */
export function TechNode({
  tech,
  locale,
  status,
  selected,
  onRoute = false,
  favorite = false,
  confidence,
  showLabel = false,
  onSelect,
}: TechNodeProps) {
  const researched = status === "researched"
  const locked = status === "locked"
  const synthesised = confidence !== null && isSynthesised(confidence)
  const guessed = confidence !== null && isGuessed(confidence)

  return (
    <button
      type="button"
      onClick={() => onSelect(tech.id)}
      aria-pressed={selected}
      aria-label={`${tech.name[locale]}, ${t("levelShort", locale)} ${tech.level}`}
      title={`${tech.name[locale]} · ${t("levelShort", locale)} ${tech.level} · ${tech.cost}`}
      className="group flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-start gap-1 rounded-md p-1 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      style={showLabel ? { width: "var(--node-label)" } : undefined}
    >
      <span
        className={cn(
          "relative grid size-[var(--node)] shrink-0 place-items-center rounded-md border bg-card text-[length:var(--node-text)] shadow-sm transition-all",
          "group-hover:z-10 group-hover:-translate-y-px group-hover:border-ring group-hover:shadow-md",
          tech.ancient && "border-ancient/60 bg-ancient-surface",
          researched && "border-researched/70 bg-researched-surface",
          onRoute && "border-route ring-[3px] ring-route/30",
          selected && "border-ring ring-[3px] ring-ring/30",
        )}
      >
        <img
          src={iconUrl(tech.id)}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          className={cn("size-3/4 object-contain transition", locked && "opacity-55 grayscale")}
        />

        {/* Уровень открытия. Заливка отличается от бейджа стоимости, иначе
            «12» читалось бы как цена. Точка внутри — пометка достоверности. */}
        <span
          className="absolute top-0 left-0 flex items-center gap-[0.2em] rounded-tl-md rounded-br-md bg-muted-foreground/15 px-[0.3em] leading-[1.5em] font-medium text-foreground/70 tabular-nums"
          title={synthesised ? t("chainSynthesised", locale) : undefined}
        >
          {synthesised && (
            <span
              role="img"
              aria-label={t(guessed ? "guessedShort" : "synthShort", locale)}
              className={cn(
                "size-[0.45em] shrink-0 rounded-full bg-synth",
                guessed && "ring-1 ring-synth/50",
              )}
            />
          )}
          {tech.level}
        </span>

        <span
          className={cn(
            "absolute -right-[0.15em] -bottom-[0.15em] grid h-[1.7em] min-w-[1.7em] place-items-center rounded-full border-2 border-background px-[0.3em] leading-none font-semibold tabular-nums",
            tech.ancient ? "bg-ancient text-background" : "bg-primary text-primary-foreground",
          )}
        >
          <span className="flex items-center gap-[0.1em]">
            {tech.ancient && <SparklesIcon className="size-[0.9em]" strokeWidth={3} />}
            {tech.cost}
          </span>
        </span>

        {researched && (
          <span className="absolute -top-[0.15em] -right-[0.15em] grid size-[1.5em] place-items-center rounded-full border-2 border-background bg-researched text-background">
            <CheckIcon className="size-[0.9em]" strokeWidth={4} />
          </span>
        )}

        {locked && (
          <span className="absolute -top-[0.15em] -right-[0.15em] grid size-[1.5em] place-items-center rounded-full border-2 border-background bg-muted text-muted-foreground">
            <LockIcon className="size-[0.8em]" strokeWidth={3} />
          </span>
        )}

        {/* Отметка игрока стоит не в углу: все четыре угла заняты данными самой
            игры, и пятый факт рядом с ними читался бы как ещё одно её свойство.
            Середина левой грани — единственная полоса, свободная на всех пяти
            ступенях размера. */}
        {favorite && (
          <span
            role="img"
            aria-label={t("inFavorites", locale)}
            title={t("inFavorites", locale)}
            className="absolute top-1/2 -left-[0.15em] grid size-[1.35em] -translate-y-1/2 place-items-center rounded-full border-2 border-background bg-favorite text-background"
          >
            <StarIcon className="size-[0.75em]" strokeWidth={3} fill="currentColor" />
          </span>
        )}

        {onRoute && (
          <span
            role="img"
            aria-label={t("onRoute", locale)}
            title={t("onRoute", locale)}
            className="absolute -bottom-[0.15em] -left-[0.15em] grid size-[1.5em] place-items-center rounded-full border-2 border-background bg-route text-background"
          >
            <RouteIcon className="size-[0.8em]" strokeWidth={3} />
          </span>
        )}
      </span>

      {showLabel && (
        <span
          className={cn(
            "line-clamp-2 text-center text-[10px] leading-tight text-muted-foreground",
            researched && "text-researched-foreground",
            locked && "opacity-70",
          )}
        >
          {tech.name[locale]}
        </span>
      )}
    </button>
  )
}
