import { CheckIcon, LockIcon, SparklesIcon } from "lucide-react"

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
  /**
   * Достоверность цепочки узла; `null` — узел вне цепочек. Именно тип, а не
   * булев флаг: забыть пометку, передав `false`, больше не получится незаметно.
   */
  confidence: ChainConfidence | null
  /** Сторона плитки в пикселях. Не меньше 44 — это цель касания. */
  size?: number
  showLabel?: boolean
  onSelect: (id: string) => void
}

/**
 * Состояние узла передаётся тремя независимыми каналами сразу — поверхностью,
 * рамкой и значком, — чтобы плитка читалась и без подписи, и в тёмной теме,
 * и при дальтонизме. Цвет в одиночку не несёт ни одного смысла.
 */
export function TechNode({
  tech,
  locale,
  status,
  selected,
  onRoute = false,
  confidence,
  size = 48,
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
      title={`${tech.name[locale]} · ${t("levelShort", locale)} ${tech.level} · ${tech.cost}`}
      className={cn(
        "group flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-start gap-1 p-1",
        "rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
      style={{ width: showLabel ? Math.max(size + 28, 76) : undefined }}
    >
      <span
        className={cn(
          "relative grid shrink-0 place-items-center rounded-md border bg-card shadow-xs transition-all",
          "group-hover:z-10 group-hover:scale-110 group-hover:shadow-md",
          tech.ancient && "border-ancient/60 bg-ancient-surface",
          researched && "border-researched/70 bg-researched-surface",
          onRoute && "border-route ring-[3px] ring-route/30",
          selected && "border-ring ring-[3px] ring-ring/30",
        )}
        style={{ width: size, height: size }}
      >
        <img
          src={iconUrl(tech.id)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className={cn("object-contain transition", locked && "opacity-55 grayscale")}
          style={{ width: size * 0.76, height: size * 0.76 }}
        />

        <span
          className={cn(
            "absolute -right-1.5 -bottom-1.5 flex min-w-4 items-center gap-px rounded-full border-2 border-background px-1 font-mono text-[10px] leading-4 font-semibold tabular-nums",
            tech.ancient ? "bg-ancient text-background" : "bg-primary text-primary-foreground",
          )}
        >
          {tech.ancient && <SparklesIcon className="size-2" strokeWidth={3} />}
          {tech.cost}
        </span>

        {researched && (
          <span className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full border-2 border-background bg-researched text-background">
            <CheckIcon className="size-2.5" strokeWidth={4} />
          </span>
        )}

        {locked && (
          <span className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full border-2 border-background bg-muted text-muted-foreground">
            <LockIcon className="size-2" strokeWidth={3} />
          </span>
        )}

        {synthesised && (
          <span
            role="img"
            aria-label={t(guessed ? "confidenceNote" : "chainSynthesised", locale)}
            title={t(guessed ? "confidenceNote" : "chainSynthesised", locale)}
            className={cn(
              "absolute -top-1 -left-1 size-2.5 rounded-full border-2 border-background bg-synth",
              guessed && "ring-2 ring-synth/50",
            )}
          />
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
