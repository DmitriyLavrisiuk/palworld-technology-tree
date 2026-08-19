import { Fragment } from "react"
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

import { CollapseHeader } from "@/components/tree/CollapseHeader"
import { TechNode } from "@/components/tree/TechNode"
import { t } from "@/lib/i18n"
import { nodeVars, type NodeMetrics } from "@/lib/nodeSize"
import { chainSummary, connectorBetween, isSynthesised, type NodeStatus } from "@/lib/tree"
import type { Chain, Locale, Technology } from "@/types/tech"

export interface ChainStep {
  tech: Technology
  /** Позиция в исходной цепочке: по ней видно, что фильтр вырезал середину. */
  index: number
}

interface LaneRowProps {
  chain: Chain
  steps: ChainStep[]
  /** Варианты того же тира, разложенные по базовой ступени. */
  variants: Map<string, Technology[]>
  locale: Locale
  statusOf: (tech: Technology) => NodeStatus
  selectedId: string | null
  routeIds: ReadonlySet<string>
  metrics: NodeMetrics
  collapsed: boolean
  onToggleCollapse: () => void
  onSelect: (id: string) => void
}

/**
 * Режим «Дорожки»: цепочка идёт подряд, шкалы уровней нет — уровень несёт
 * сам узел. На широком экране заголовок стоит слева колонкой, на узком —
 * сверху; это одна разметка с разным направлением флекса, без ветвлений.
 */
export function LaneRow({
  chain,
  steps,
  variants,
  locale,
  statusOf,
  selectedId,
  routeIds,
  metrics,
  collapsed,
  onToggleCollapse,
  onSelect,
}: LaneRowProps) {
  const summary = chainSummary(steps.map((step) => step.tech))
  const synthesised = isSynthesised(chain.confidence)

  return (
    <section className="border-b py-2 last:border-b-0 sm:flex sm:items-start sm:gap-3">
      <div className="sm:w-44 sm:shrink-0">
        <CollapseHeader
          collapsed={collapsed}
          onToggle={onToggleCollapse}
          label={chain.name[locale]}
        >
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="truncate text-sm font-medium">{chain.name[locale]}</span>
              {synthesised && (
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                  <span aria-hidden className="size-1.5 rounded-full bg-synth" />
                  {t("synthShort", locale)}
                </span>
              )}
            </span>
            {summary && (
              <span className="block text-[10px] text-muted-foreground tabular-nums">
                {summary.count} · {t("levelShort", locale)} {summary.minLevel}–{summary.maxLevel}
                {chain.kind !== "chain" && ` · ${t("parallel", locale)}`}
              </span>
            )}
          </span>
        </CollapseHeader>
      </div>

      {!collapsed && (
        <div className="flex flex-wrap items-start gap-0.5 px-1 sm:flex-1 sm:px-0">
          {steps.map((step, position) => {
            const previous = steps[position - 1]
            const connector = previous
              ? connectorBetween(previous.index, step.index, chain.kind)
              : null
            const stepVariants = variants.get(step.tech.id) ?? []

            return (
              <Fragment key={step.tech.id}>
                {connector === "arrow" && (
                  <ChevronRightIcon
                    aria-hidden
                    className="mt-6 size-4 shrink-0 self-start text-muted-foreground/60"
                  />
                )}
                {connector === "gap" && (
                  <MoreHorizontalIcon
                    className="mt-6 size-4 shrink-0 self-start text-muted-foreground/60"
                    aria-label={t("stepsHidden", locale)}
                  />
                )}

                <TechNode
                  tech={step.tech}
                  locale={locale}
                  status={statusOf(step.tech)}
                  selected={selectedId === step.tech.id}
                  onRoute={routeIds.has(step.tech.id)}
                  confidence={chain.confidence}
                  showLabel
                  onSelect={onSelect}
                />

                {stepVariants.length > 0 && (
                  <span
                    className="flex flex-wrap items-start gap-0.5 self-start rounded-md border border-dashed px-0.5"
                    title={t("variantsOf", locale)}
                    style={nodeVars(metrics.variant)}
                  >
                    {stepVariants.map((tech) => (
                      <TechNode
                        key={tech.id}
                        tech={tech}
                        locale={locale}
                        status={statusOf(tech)}
                        selected={selectedId === tech.id}
                        onRoute={routeIds.has(tech.id)}
                        confidence={chain.confidence}
                        showLabel
                        onSelect={onSelect}
                      />
                    ))}
                  </span>
                )}
              </Fragment>
            )
          })}
        </div>
      )}
    </section>
  )
}
