import { Fragment } from "react"
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

import { TechNode } from "@/components/tree/TechNode"
import { t } from "@/lib/i18n"
import { nodeVars, type NodeMetrics } from "@/lib/nodeSize"
import { isSynthesised, type NodeStatus } from "@/lib/tree"
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
  onSelect: (id: string) => void
}

/**
 * Режим «Дорожки»: цепочка идёт подряд, шкалы уровней нет — уровень несёт
 * сам узел. Строка переносится, поэтому на узком экране она становится выше,
 * а не уезжает за край.
 *
 * Стрелка ставится только между соседними ступенями и только у цепочек вида
 * `chain`. Варианты (жара/холод/вес) — не ступени, а вырезанная фильтром
 * середина не даёт права соединять то, что осталось: и в том, и в другом
 * случае стрелка соврала бы про порядок.
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
  onSelect,
}: LaneRowProps) {
  const isChain = chain.kind === "chain"

  return (
    <section className="border-b py-2 last:border-b-0">
      <header className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-2">
        <h3 className="text-sm font-medium">{chain.name[locale]}</h3>
        {isSynthesised(chain.confidence) && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-synth" />
            {t("synthShort", locale)}
          </span>
        )}
        {!isChain && (
          <span className="text-[10px] text-muted-foreground">{t("parallel", locale)}</span>
        )}
      </header>

      <div className="flex flex-wrap items-start gap-0.5 px-1">
        {steps.map((step, position) => {
          const previous = steps[position - 1]
          const adjacent = previous ? step.index - previous.index === 1 : true
          const stepVariants = variants.get(step.tech.id) ?? []

          return (
            <Fragment key={step.tech.id}>
              {previous &&
                (adjacent ? (
                  isChain && (
                    <ChevronRightIcon
                      aria-hidden
                      className="mt-4 size-4 shrink-0 self-start text-muted-foreground/60"
                    />
                  )
                ) : (
                  <MoreHorizontalIcon
                    className="mt-4 size-4 shrink-0 self-start text-muted-foreground/60"
                    aria-label={t("stepsHidden", locale)}
                  />
                ))}

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
    </section>
  )
}
