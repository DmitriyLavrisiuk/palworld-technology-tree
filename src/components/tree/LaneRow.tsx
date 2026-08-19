import { Fragment } from "react"
import { ChevronRightIcon } from "lucide-react"

import { TechNode } from "@/components/tree/TechNode"
import { t } from "@/lib/i18n"
import { isSynthesised, type NodeStatus } from "@/lib/tree"
import type { Chain, Locale, Technology } from "@/types/tech"

interface LaneRowProps {
  chain: Chain
  members: Technology[]
  locale: Locale
  statusOf: (tech: Technology) => NodeStatus
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * Режим «Дорожки»: цепочка идёт подряд, шкалы уровней нет — уровень несёт
 * сам узел. Строка переносится, поэтому на узком экране она просто становится
 * выше, а не уезжает за край.
 *
 * У цепочки вида `group` стрелок нет: её члены — параллельные варианты
 * (семь культур, пять модулей), и стрелка соврала бы про порядок.
 */
export function LaneRow({
  chain,
  members,
  locale,
  statusOf,
  selectedId,
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
        {members.map((tech, index) => (
          <Fragment key={tech.id}>
            {index > 0 && isChain && (
              <ChevronRightIcon
                aria-hidden
                className="mt-4 size-4 shrink-0 self-start text-muted-foreground/60"
              />
            )}
            <TechNode
              tech={tech}
              locale={locale}
              status={statusOf(tech)}
              selected={selectedId === tech.id}
              synthesised={isSynthesised(chain.confidence)}
              size={48}
              showLabel
              onSelect={onSelect}
            />
          </Fragment>
        ))}
      </div>
    </section>
  )
}
