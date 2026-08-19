import { useMemo } from "react"

import { ChainRow } from "@/components/tree/ChainRow"
import { CompactCard } from "@/components/tree/CompactCard"
import { LaneRow } from "@/components/tree/LaneRow"
import { LevelRuler } from "@/components/tree/LevelRuler"
import { LooseRow } from "@/components/tree/LooseRow"
import { TechNode } from "@/components/tree/TechNode"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import type { ViewMode } from "@/hooks/useProgress"
import { GRID, GROUP_NAMES, GROUP_ORDER } from "@/lib/constants"
import type { TechData } from "@/lib/data"
import { t } from "@/lib/i18n"
import { isSynthesised, type NodeStatus, type VisibleTech } from "@/lib/tree"
import type { Chain, GroupKey, Locale, Technology } from "@/types/tech"

const LABEL_WIDTH = 144
const NODE_SIZE = 44

interface TechTreeProps {
  data: TechData
  locale: Locale
  view: ViewMode
  playerLevel: number
  /** Уже отобранные и размеченные узлы: отбор живёт в App, здесь — раскладка. */
  visible: VisibleTech[]
  selectedId: string | null
  onSelect: (id: string) => void
}

interface Section {
  key: string
  title: string
  chains: { chain: Chain; members: Technology[] }[]
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
  onSelect,
}: TechTreeProps) {
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
      const ids = [
        ...chain.members,
        ...Object.values(chain.variants ?? {}).flat(),
      ].filter((id) => shown.has(id))
      if (!ids.length) continue

      const members = ids
        .map((id) => data.byId.get(id))
        .filter((tech): tech is Technology => Boolean(tech))
        .sort((a, b) => a.level - b.level || a.cost - b.cost)

      byGroup.get(chain.group)?.chains.push({ chain, members })
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
      <div className="flex flex-col gap-6 p-3">
        {sections.map((section) => {
          const all = [...section.chains.flatMap((entry) => entry.members), ...section.loose].sort(
            (a, b) => a.level - b.level || a.cost - b.cost,
          )
          const synth = new Set(
            section.chains
              .filter((entry) => isSynthesised(entry.chain.confidence))
              .flatMap((entry) => entry.members.map((tech) => tech.id)),
          )

          return (
            <section key={section.key}>
              <h2 className="mb-2 text-sm font-semibold">{section.title}</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-1.5">
                {all.map((tech) => (
                  <CompactCard
                    key={tech.id}
                    tech={tech}
                    locale={locale}
                    status={statusOf(tech)}
                    selected={selectedId === tech.id}
                    synthesised={synth.has(tech.id)}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  if (view === "lanes") {
    return (
      <div className="flex flex-col gap-6 p-1 sm:p-3">
        {sections.map((section) => (
          <section key={section.key}>
            <h2 className="mb-1 px-2 text-sm font-semibold">{section.title}</h2>
            <div className="rounded-md border">
              {section.chains.map((entry) => (
                <LaneRow
                  key={entry.chain.id}
                  chain={entry.chain}
                  members={entry.members}
                  locale={locale}
                  statusOf={statusOf}
                  selectedId={selectedId}
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
                        synthesised={false}
                        size={44}
                        showLabel
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    )
  }

  // view === "levels"
  return (
    <div className="flex flex-col gap-6 p-1 sm:p-3">
      {sections.map((section) => (
        <section key={section.key}>
          <h2 className="mb-1 px-2 text-sm font-semibold">{section.title}</h2>
          <div className="overflow-x-auto rounded-md border">
            <div style={{ width: LABEL_WIDTH + 80 * GRID.levelStep }}>
              <LevelRuler
                step={GRID.levelStep}
                playerLevel={playerLevel}
                labelWidth={LABEL_WIDTH}
              />
              {section.chains.map((entry) => (
                <ChainRow
                  key={entry.chain.id}
                  chain={entry.chain}
                  members={entry.members}
                  locale={locale}
                  statusOf={statusOf}
                  selectedId={selectedId}
                  step={GRID.levelStep}
                  labelWidth={LABEL_WIDTH}
                  playerLevel={playerLevel}
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
                  step={GRID.levelStep}
                  labelWidth={LABEL_WIDTH}
                  size={NODE_SIZE}
                  onSelect={onSelect}
                />
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
