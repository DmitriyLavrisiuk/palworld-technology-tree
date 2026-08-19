import { TechNode } from "@/components/tree/TechNode"
import { MAX_LEVEL } from "@/lib/constants"
import { t } from "@/lib/i18n"
import { packRows, type NodeStatus } from "@/lib/tree"
import type { Locale, Technology } from "@/types/tech"

interface LooseRowProps {
  members: Technology[]
  /** Подпись слева. По умолчанию — «вне цепочек». */
  label?: string
  locale: Locale
  statusOf: (tech: Technology) => NodeStatus
  selectedId: string | null
  routeIds: ReadonlySet<string>
  step: number
  labelWidth: number
  size: number
  onSelect: (id: string) => void
}

export function LooseRow({
  members,
  label,
  locale,
  statusOf,
  selectedId,
  routeIds,
  step,
  labelWidth,
  size,
  onSelect,
}: LooseRowProps) {
  const rows = packRows(members, Math.max(1, Math.ceil(size / step)))

  return (
    <div className="flex border-b last:border-b-0">
      <div
        className="sticky left-0 z-20 flex shrink-0 items-center border-r bg-card px-2 py-1"
        style={{ width: labelWidth }}
      >
        <span className="truncate text-xs text-muted-foreground" title={label}>
          {label ?? t("ungrouped", locale)}
        </span>
      </div>

      <div style={{ width: MAX_LEVEL * step }}>
        {rows.map((row, index) => (
          <div key={index} className="relative h-16 border-b border-dashed last:border-b-0">
            {row.map((tech) => (
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
                  onRoute={routeIds.has(tech.id)}
                  confidence={null}
                  size={size}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
