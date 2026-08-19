import { Fragment } from "react"
import { ChevronRightIcon, MoreHorizontalIcon, SparklesIcon } from "lucide-react"

import { CollapseHeader } from "@/components/tree/CollapseHeader"
import type { ChainStep } from "@/components/tree/LaneRow"
import { TechNode } from "@/components/tree/TechNode"
import { pointsLabel, t } from "@/lib/i18n"
import { nodeVars, type NodeMetrics } from "@/lib/nodeSize"
import { chainSummary, connectorBetween, isSynthesised, type NodeStatus } from "@/lib/tree"
import type { Chain, Locale, Technology } from "@/types/tech"

interface ChainCardProps {
  chain: Chain
  steps: ChainStep[]
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
 * Режим «Компактно»: карточка на цепочку. Здесь смотрят не на отдельную
 * технологию, а на семейство целиком — сколько ступеней, в каком диапазоне
 * уровней и во сколько очков обойдётся.
 */
export function ChainCard({
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
}: ChainCardProps) {
  const all = [...steps.map((step) => step.tech), ...[...variants.values()].flat()]
  const summary = chainSummary(all)
  const synthesised = isSynthesised(chain.confidence)

  return (
    <section className="flex flex-col rounded-md border p-2">
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
            <span className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground tabular-nums">
              <span>
                {t("levelShort", locale)} {summary.minLevel}–{summary.maxLevel}
              </span>
              {summary.techPoints > 0 && (
                <span>
                  {summary.techPoints} {pointsLabel(summary.techPoints, locale, false)}
                </span>
              )}
              {summary.ancientPoints > 0 && (
                <span className="inline-flex items-center gap-0.5 text-ancient-foreground">
                  <SparklesIcon className="size-2.5" />
                  {summary.ancientPoints}
                </span>
              )}
              {chain.kind !== "chain" && <span>{t("parallel", locale)}</span>}
            </span>
          )}
        </span>
      </CollapseHeader>

      {!collapsed && (
        <div
          className="mt-1 flex flex-wrap items-center gap-0.5"
          style={nodeVars(metrics.mini)}
        >
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
                    className="size-3 shrink-0 text-muted-foreground/60"
                  />
                )}
                {connector === "gap" && (
                  <MoreHorizontalIcon
                    className="size-3 shrink-0 text-muted-foreground/60"
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
                  onSelect={onSelect}
                />

                {stepVariants.map((tech) => (
                  <TechNode
                    key={tech.id}
                    tech={tech}
                    locale={locale}
                    status={statusOf(tech)}
                    selected={selectedId === tech.id}
                    onRoute={routeIds.has(tech.id)}
                    confidence={chain.confidence}
                    onSelect={onSelect}
                  />
                ))}
              </Fragment>
            )
          })}
        </div>
      )}
    </section>
  )
}
