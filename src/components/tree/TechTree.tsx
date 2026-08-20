import { useMemo } from "react"

import { ChainCard } from "@/components/tree/ChainCard"
import { ChainRow } from "@/components/tree/ChainRow"
import { CollapseHeader } from "@/components/tree/CollapseHeader"
import { LaneRow, type ChainStep } from "@/components/tree/LaneRow"
import { LevelRuler } from "@/components/tree/LevelRuler"
import { LooseRow } from "@/components/tree/LooseRow"
import { TechNode } from "@/components/tree/TechNode"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import type { ViewMode } from "@/hooks/useProgress"
import { GROUP_NAMES, GROUP_ORDER, MAX_LEVEL } from "@/lib/constants"
import type { TechData } from "@/lib/data"
import { t } from "@/lib/i18n"
import { nodeMetrics, nodeVars, type NodeSizeKey } from "@/lib/nodeSize"
import type { NodeStatus, VisibleTech } from "@/lib/tree"
import type { Chain, GroupKey, Locale, Technology } from "@/types/tech"

const LABEL_WIDTH = 144

interface TechTreeProps {
  data: TechData
  locale: Locale
  view: ViewMode
  playerLevel: number
  /** Уже отобранные и размеченные узлы: отбор живёт в App, здесь — раскладка. */
  visible: VisibleTech[]
  selectedId: string | null
  /** Идентификаторы узлов проложенного маршрута — для подсветки. */
  routeIds: ReadonlySet<string>
  favoriteIds: ReadonlySet<string>
  nodeSize: NodeSizeKey
  /** Ключи свёрнутых секций и цепочек; живут в localStorage. */
  collapsed: ReadonlySet<string>
  onToggleCollapse: (key: string) => void
  onSelect: (id: string) => void
}

interface ChainEntry {
  chain: Chain
  /** Видимые ступени с исходной позицией — по ней видно вырезанную середину. */
  steps: ChainStep[]
  /** Видимые варианты того же тира, разложенные по базовой ступени. */
  variants: Map<string, Technology[]>
}

interface Section {
  key: string
  title: string
  chains: ChainEntry[]
  loose: Technology[]
  /** Подпись ряда без цепочек. У корзин это их собственное имя. */
  looseLabel?: string
}

export function TechTree({
  data,
  locale,
  view,
  playerLevel,
  visible,
  selectedId,
  routeIds,
  favoriteIds,
  nodeSize,
  collapsed,
  onToggleCollapse,
  onSelect,
}: TechTreeProps) {
  const metrics = nodeMetrics(nodeSize)

  /**
   * Набор свёрнутых ключей намеренно НЕ входит в зависимости большого useMemo
   * ниже — иначе каждый щелчок шевроном пересобирал бы все секции.
   */
  const toggle = onToggleCollapse

  const { sections, statusOf, total } = useMemo(() => {
    const statuses = new Map<string, NodeStatus>(visible.map((item) => [item.tech.id, item.status]))
    const shown = new Set(statuses.keys())

    const byGroup = new Map<GroupKey, Section>()
    for (const group of GROUP_ORDER) {
      byGroup.set(group, {
        key: group,
        title: GROUP_NAMES[group][locale],
        chains: [],
        loose: [],
      })
    }

    for (const chain of data.chains.chains) {
      const steps: ChainStep[] = []
      chain.members.forEach((id, index) => {
        const tech = shown.has(id) ? data.byId.get(id) : undefined
        if (tech) steps.push({ tech, index })
      })

      const variants = new Map<string, Technology[]>()
      for (const [base, list] of Object.entries(chain.variants ?? {})) {
        const visibleVariants = list
          .filter((id) => shown.has(id))
          .map((id) => data.byId.get(id))
          .filter((tech): tech is Technology => Boolean(tech))
        if (visibleVariants.length) variants.set(base, visibleVariants)
      }

      if (!steps.length && !variants.size) continue
      byGroup.get(chain.group)?.chains.push({ chain, steps, variants })
    }

    for (const entry of data.chains.loose) {
      const members = entry.members
        .filter((id) => shown.has(id))
        .map((id) => data.byId.get(id))
        .filter((tech): tech is Technology => Boolean(tech))
      byGroup.get(entry.group)?.loose.push(...members)
    }

    const list = [...byGroup.values()].filter(
      (section) => section.chains.length || section.loose.length,
    )

    for (const bucket of data.chains.buckets) {
      const members = bucket.members
        .filter((id) => shown.has(id))
        .map((id) => data.byId.get(id))
        .filter((tech): tech is Technology => Boolean(tech))
      if (members.length) {
        list.push({
          key: bucket.id,
          title: bucket.name[locale],
          chains: [],
          loose: members,
          looseLabel: bucket.name[locale],
        })
      }
    }

    return {
      sections: list,
      statusOf: (tech: Technology) => statuses.get(tech.id) ?? "locked",
      total: visible.length,
    }
  }, [data, locale, visible])

  if (!total) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyTitle>{t("nothingFound", locale)}</EmptyTitle>
          <EmptyDescription>{t("nothingFoundHint", locale)}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (view === "compact") {
    return (
      <div className="flex flex-col gap-2 p-2 sm:p-3">
        {sections.map((section) => {
          const isCollapsed = collapsed.has(section.key)

          return (
            <section key={section.key}>
              <SectionHeading
                section={section}
                collapsed={isCollapsed}
                onToggle={() => toggle(section.key)}
              />

              {!isCollapsed && (
                <div className="flex flex-col gap-3">
                  {section.chains.length > 0 && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-2">
                      {section.chains.map((entry) => (
                        <ChainCard
                          key={entry.chain.id}
                          chain={entry.chain}
                          steps={entry.steps}
                          variants={entry.variants}
                          locale={locale}
                          statusOf={statusOf}
                          selectedId={selectedId}
                          routeIds={routeIds}
                          favoriteIds={favoriteIds}
                          metrics={metrics}
                          collapsed={collapsed.has(entry.chain.id)}
                          onToggleCollapse={() => toggle(entry.chain.id)}
                          onSelect={onSelect}
                        />
                      ))}
                    </div>
                  )}

                  {/* Одиночки и корзины — блоком во всю ширину, а не карточкой
                      в сетке: вне цепочек живут 319 узлов из 588, и 124 седла
                      в колонке 320 px превратились бы в километр. */}
                  {section.loose.length > 0 && (
                    <div className="rounded-md border p-2">
                      <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                        {section.looseLabel ?? t("ungrouped", locale)}
                        <span className="ml-2 tabular-nums">{section.loose.length}</span>
                      </p>
                      <div
                        className="flex flex-wrap items-center gap-0.5"
                        style={nodeVars(metrics.mini)}
                      >
                        {section.loose.map((tech) => (
                          <TechNode
                            key={tech.id}
                            tech={tech}
                            locale={locale}
                            status={statusOf(tech)}
                            selected={selectedId === tech.id}
                            onRoute={routeIds.has(tech.id)}
                            favorite={favoriteIds.has(tech.id)}
                            confidence={null}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>
    )
  }

  if (view === "lanes") {
    return (
      <div className="flex flex-col gap-2 p-1 sm:p-3" style={nodeVars(metrics.step)}>
        {sections.map((section) => (
          <section key={section.key}>
            <SectionHeading
              section={section}
              collapsed={collapsed.has(section.key)}
              onToggle={() => toggle(section.key)}
            />
            {collapsed.has(section.key) ? null : (
            <div className="rounded-md border">
              {section.chains.map((entry) => (
                <LaneRow
                  key={entry.chain.id}
                  chain={entry.chain}
                  steps={entry.steps}
                  variants={entry.variants}
                  locale={locale}
                  statusOf={statusOf}
                  selectedId={selectedId}
                  routeIds={routeIds}
                  favoriteIds={favoriteIds}
                  metrics={metrics}
                  collapsed={collapsed.has(entry.chain.id)}
                  onToggleCollapse={() => toggle(entry.chain.id)}
                  onSelect={onSelect}
                />
              ))}
              {section.loose.length > 0 && (
                <div className="border-t p-1">
                  <p className="px-1 pb-1 text-[10px] text-muted-foreground">
                    {section.looseLabel ?? t("ungrouped", locale)}
                  </p>
                  <div className="flex flex-wrap gap-0.5">
                    {section.loose.map((tech) => (
                      <TechNode
                        key={tech.id}
                        tech={tech}
                        locale={locale}
                        status={statusOf(tech)}
                        selected={selectedId === tech.id}
                        onRoute={routeIds.has(tech.id)}
                        favorite={favoriteIds.has(tech.id)}
                        confidence={null}
                        showLabel
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}
          </section>
        ))}
      </div>
    )
  }

  // view === "levels"
  return (
    <div className="flex flex-col gap-2 p-1 sm:p-3">
      {sections.map((section) => (
        <section key={section.key}>
          <SectionHeading
            section={section}
            collapsed={collapsed.has(section.key)}
            onToggle={() => toggle(section.key)}
          />
          {collapsed.has(section.key) ? null : (
          <div className="overflow-x-auto rounded-md border">
            <div style={{ width: LABEL_WIDTH + MAX_LEVEL * metrics.levelStep }}>
              <LevelRuler
                step={metrics.levelStep}
                playerLevel={playerLevel}
                labelWidth={LABEL_WIDTH}
              />
              {section.chains.map((entry) => (
                <ChainRow
                  key={entry.chain.id}
                  chain={entry.chain}
                  members={entry.steps.map((step) => step.tech)}
                  variants={entry.variants}
                  locale={locale}
                  statusOf={statusOf}
                  selectedId={selectedId}
                  routeIds={routeIds}
                  favoriteIds={favoriteIds}
                  metrics={metrics}
                  labelWidth={LABEL_WIDTH}
                  playerLevel={playerLevel}
                  collapsed={collapsed.has(entry.chain.id)}
                  onToggleCollapse={() => toggle(entry.chain.id)}
                  onSelect={onSelect}
                />
              ))}
              {section.loose.length > 0 && (
                <LooseRow
                  members={section.loose}
                  label={section.looseLabel}
                  locale={locale}
                  statusOf={statusOf}
                  selectedId={selectedId}
                  routeIds={routeIds}
                  favoriteIds={favoriteIds}
                  labelWidth={LABEL_WIDTH}
                  metrics={metrics}
                  onSelect={onSelect}
                />
              )}
            </div>
          </div>
          )}
        </section>
      ))}
    </div>
  )
}

/** Заголовок секции: шеврон, название и сколько узлов в ней осталось после фильтров. */
function SectionHeading({
  section,
  collapsed,
  onToggle,
}: {
  section: Section
  collapsed: boolean
  onToggle: () => void
}) {
  const count =
    section.chains.reduce(
      (sum, entry) => sum + entry.steps.length + [...entry.variants.values()].flat().length,
      0,
    ) + section.loose.length

  return (
    <CollapseHeader collapsed={collapsed} onToggle={onToggle} label={section.title} className="mb-1">
      <span className="text-sm font-semibold">{section.title}</span>
      <Badge variant="secondary" className="tabular-nums">
        {count}
      </Badge>
    </CollapseHeader>
  )
}
