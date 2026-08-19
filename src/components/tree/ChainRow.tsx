import { TechNode } from "@/components/tree/TechNode"
import { GRID, MAX_LEVEL } from "@/lib/constants"
import { t } from "@/lib/i18n"
import { isSynthesised, type NodeStatus } from "@/lib/tree"
import { cn } from "@/lib/utils"
import type { Chain, Locale, Technology } from "@/types/tech"

interface ChainRowProps {
  chain: Chain
  members: Technology[]
  locale: Locale
  statusOf: (tech: Technology) => NodeStatus
  selectedId: string | null
  step: number
  labelWidth: number
  playerLevel: number
  onSelect: (id: string) => void
}

/**
 * Режим «Шкала уровней»: X узла задаётся уровнем, который его открывает.
 * Никакой раскладки графом — умножение уровня на шаг сетки, поэтому
 * липкая линейка сверху и липкая подпись слева продолжают работать.
 */
export function ChainRow({
  chain,
  members,
  locale,
  statusOf,
  selectedId,
  step,
  labelWidth,
  playerLevel,
  onSelect,
}: ChainRowProps) {
  const size = Math.min(GRID.node / 2.5, step * 0.9)

  return (
    <div className="flex border-b last:border-b-0">
      <div
        className="sticky left-0 z-20 flex shrink-0 flex-col justify-center gap-0.5 border-r bg-card px-2 py-1"
        style={{ width: labelWidth }}
      >
        <span className="truncate text-xs font-medium" title={chain.name[locale]}>
          {chain.name[locale]}
        </span>
        {isSynthesised(chain.confidence) && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-synth" />
            {t("synthShort", locale)}
          </span>
        )}
      </div>

      <div className="relative h-16" style={{ width: MAX_LEVEL * step }}>
        <div
          aria-hidden
          className={cn("absolute top-1/2 h-px bg-rail")}
          style={{ left: 0, right: 0 }}
        />
        <div
          aria-hidden
          className="absolute top-0 bottom-0 w-px bg-synth/40"
          style={{ left: (playerLevel - 0.5) * step }}
        />

        {members.map((tech) => (
          <div
            key={tech.id}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: (tech.level - 0.5) * step }}
          >
            <TechNode
              tech={tech}
              locale={locale}
              status={statusOf(tech)}
              selected={selectedId === tech.id}
              synthesised={isSynthesised(chain.confidence)}
              size={size}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
