import { CheckIcon, LockIcon, SparklesIcon } from "lucide-react"

import { iconUrl } from "@/lib/data"
import { t } from "@/lib/i18n"
import { isSynthesised, type NodeStatus } from "@/lib/tree"
import { cn } from "@/lib/utils"
import type { ChainConfidence, Locale, Technology } from "@/types/tech"

interface CompactCardProps {
  tech: Technology
  locale: Locale
  status: NodeStatus
  selected: boolean
  onRoute?: boolean
  confidence: ChainConfidence | null
  onSelect: (id: string) => void
}

/**
 * Режим «Компактно»: карточка-строка. Максимальная плотность при полной
 * читаемости названия — основа мобильной раскладки.
 */
export function CompactCard({
  tech,
  locale,
  status,
  selected,
  onRoute = false,
  confidence,
  onSelect,
}: CompactCardProps) {
  const researched = status === "researched"
  const locked = status === "locked"
  const synthesised = confidence !== null && isSynthesised(confidence)

  return (
    <button
      type="button"
      onClick={() => onSelect(tech.id)}
      aria-pressed={selected}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-md border p-1.5 text-left transition-colors",
        "hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        tech.ancient && "border-ancient/50 bg-ancient-surface",
        researched && "border-researched/60 bg-researched-surface",
        onRoute && "border-route ring-[3px] ring-route/30",
        selected && "border-ring ring-[3px] ring-ring/30",
      )}
    >
      <span className="relative shrink-0">
        <img
          src={iconUrl(tech.id)}
          alt=""
          width={32}
          height={32}
          loading="lazy"
          decoding="async"
          className={cn("size-8 object-contain", locked && "opacity-55 grayscale")}
        />
        {synthesised && (
          <span
            aria-hidden
            className="absolute -top-0.5 -left-0.5 size-2 rounded-full border border-background bg-synth"
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{tech.name[locale]}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {t("levelShort", locale)} {tech.level}
          </span>
          <span className="inline-flex items-center gap-px tabular-nums">
            {tech.ancient && <SparklesIcon className="size-3 text-ancient" strokeWidth={3} />}
            {tech.cost}
          </span>
          {synthesised && (
            <span className="inline-flex items-center gap-1 text-synth">
              <span aria-hidden className="size-1.5 rounded-full bg-synth" />
              {t("synthShort", locale)}
            </span>
          )}
        </span>
      </span>

      {researched && <CheckIcon className="size-4 shrink-0 text-researched" strokeWidth={3} />}
      {locked && <LockIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.5} />}
    </button>
  )
}
