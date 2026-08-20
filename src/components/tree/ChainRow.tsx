import { CollapseHeader } from "@/components/tree/CollapseHeader"
import { TechNode } from "@/components/tree/TechNode"
import { MAX_LEVEL } from "@/lib/constants"
import { t } from "@/lib/i18n"
import { nodeVars, type NodeMetrics } from "@/lib/nodeSize"
import { isSynthesised, type NodeStatus } from "@/lib/tree"
import { cn } from "@/lib/utils"
import type { Chain, Locale, Technology } from "@/types/tech"

interface ChainRowProps {
  chain: Chain
  members: Technology[]
  /** Варианты того же тира: стоят под своей ступенью, а не рядом с ней. */
  variants: Map<string, Technology[]>
  locale: Locale
  statusOf: (tech: Technology) => NodeStatus
  selectedId: string | null
  routeIds: ReadonlySet<string>
  favoriteIds: ReadonlySet<string>
  metrics: NodeMetrics
  labelWidth: number
  playerLevel: number
  collapsed: boolean
  onToggleCollapse: () => void
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
  variants,
  locale,
  statusOf,
  selectedId,
  routeIds,
  favoriteIds,
  metrics,
  labelWidth,
  playerLevel,
  collapsed,
  onToggleCollapse,
  onSelect,
}: ChainRowProps) {
  const step = metrics.levelStep
  const allVariants = [...variants.values()].flat()
  const height = collapsed ? 44 : metrics.rowHeight(allVariants.length > 0)
  const railTop = metrics.rowBase / 2

  return (
    <div className="flex border-b last:border-b-0">
      <div
        className="sticky left-0 z-20 flex shrink-0 items-center border-r bg-card px-1"
        style={{ width: labelWidth }}
      >
        <CollapseHeader
          collapsed={collapsed}
          onToggle={onToggleCollapse}
          label={chain.name[locale]}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium" title={chain.name[locale]}>
              {chain.name[locale]}
            </span>
            {isSynthesised(chain.confidence) && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-synth" />
                {t("synthShort", locale)}
              </span>
            )}
          </span>
        </CollapseHeader>
      </div>

      <div className="relative" style={{ width: MAX_LEVEL * step, height }}>
        {collapsed ? null : (
        <>
        <div aria-hidden className={cn("absolute h-px bg-rail")} style={{ left: 0, right: 0, top: railTop }} />
        <div
          aria-hidden
          className="absolute inset-y-0 w-px bg-synth/40"
          style={{ left: (playerLevel - 0.5) * step }}
        />

        <div style={nodeVars(metrics.dense)}>
          {members.map((tech) => (
            <div
              key={tech.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: (tech.level - 0.5) * step, top: railTop }}
            >
              <TechNode
                tech={tech}
                locale={locale}
                status={statusOf(tech)}
                selected={selectedId === tech.id}
                onRoute={routeIds.has(tech.id)}
                favorite={favoriteIds.has(tech.id)}
                confidence={chain.confidence}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>

        <div style={nodeVars(metrics.mini)}>
          {allVariants.map((tech) => (
            <div
              key={tech.id}
              className="absolute -translate-x-1/2"
              style={{ left: (tech.level - 0.5) * step, top: metrics.rowBase + 4 }}
              title={t("variantsOf", locale)}
            >
              <TechNode
                tech={tech}
                locale={locale}
                status={statusOf(tech)}
                selected={selectedId === tech.id}
                onRoute={routeIds.has(tech.id)}
                favorite={favoriteIds.has(tech.id)}
                confidence={chain.confidence}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </div>
  )
}
