import { useEffect, useMemo, useState } from "react"

import { PageLoader } from "@/components/PageLoader"
import { Toolbar } from "@/components/Toolbar"
import { DetailSheet } from "@/components/tree/DetailSheet"
import { PlannerBar } from "@/components/tree/PlannerBar"
import { TechTree } from "@/components/tree/TechTree"
import type { ProgressState } from "@/hooks/useProgress"
import { loadTechData, peekTechData, type TechData } from "@/lib/data"
import { buildRoute } from "@/lib/planner"
import { t } from "@/lib/i18n"
import {
  NO_FILTERS,
  countByGroup,
  researchedTotals,
  visibleTechs,
  type Filters,
} from "@/lib/tree"

interface ResearchPageProps {
  /**
   * Состояние приходит объектом сверху, а не пропами по одному, и это не
   * вольность: useProgress можно вызвать ровно один раз на приложение.
   * Второй вызов завёл бы независимую копию, и две записи в localStorage
   * начали бы затирать друг друга — прогресс терялся бы молча.
   */
  progress: ProgressState
}

/** Раздел «Исследования»: дерево технологий целиком. */
export function ResearchPage({ progress }: ResearchPageProps) {
  const [data, setData] = useState<TechData | null>(peekTechData)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  /** Переключаемые фильтры эфемерны, категории живут в хранилище. */
  const [toggles, setToggles] = useState<Filters>(NO_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** Цель маршрута живёт только в сессии: в localStorage её не кладём. */
  const [routeTargetId, setRouteTargetId] = useState<string | null>(null)

  useEffect(() => {
    loadTechData().then(setData, (cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    })
  }, [])

  const filters = useMemo<Filters>(
    () => ({ ...toggles, groups: new Set(progress.groups) }),
    [toggles, progress.groups],
  )

  const groupCounts = useMemo(() => countByGroup(data?.technologies ?? []), [data])

  const visible = useMemo(
    () =>
      data
        ? visibleTechs(
            data.technologies,
            progress.researched,
            progress.level,
            query,
            filters,
            progress.favorites,
          )
        : [],
    [data, progress.researched, progress.level, query, filters, progress.favorites],
  )

  const route = useMemo(
    () => (data && routeTargetId ? buildRoute(routeTargetId, data, progress.researched) : null),
    [data, routeTargetId, progress.researched],
  )

  const totals = useMemo(
    () => researchedTotals(data?.technologies ?? [], progress.researched),
    [data, progress.researched],
  )

  const routeIds = useMemo(
    () => new Set(route?.steps.map((step) => step.tech.id) ?? []),
    [route],
  )

  /**
   * Счётчик считается по живым технологиям, а не по размеру множества:
   * технология, исчезнувшая после патча игры, остаётся в хранилище навсегда
   * и иначе завышала бы цифру на пилюле.
   */
  const favoritesCount = useMemo(() => {
    if (!data) return 0
    return [...progress.favorites].filter((id) => data.byId.has(id)).length
  }, [data, progress.favorites])

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-4 text-sm">
        <p className="text-destructive">{t("loadFailed", progress.locale)}</p>
        <pre className="mt-2 overflow-x-auto text-muted-foreground">{error}</pre>
      </main>
    )
  }

  if (!data) return <PageLoader locale={progress.locale} />

  return (
    // Колонка с растущим main: без неё при коротком контенте липкая панель
    // маршрута встаёт сразу под последней карточкой, а не у низа экрана.
    <div className="flex min-h-dvh flex-col">
      <Toolbar
        locale={progress.locale}
        view={progress.view}
        theme={progress.theme}
        level={progress.level}
        query={query}
        filters={filters}
        shown={visible.length}
        total={data.technologies.length}
        totals={totals}
        nodeSize={progress.nodeSize}
        onQuery={setQuery}
        onView={progress.setView}
        onLevel={progress.setLevel}
        onLocale={progress.setLocale}
        onTheme={progress.setTheme}
        onFilters={setToggles}
        groupCounts={groupCounts}
        onToggleGroup={progress.toggleGroup}
        onClearGroups={progress.clearGroups}
        favoritesCount={favoritesCount}
        onNodeSize={progress.setNodeSize}
      />

      <main className="flex-1">
        <h1 className="sr-only">{t("appShort", progress.locale)}</h1>
        <TechTree
          data={data}
          locale={progress.locale}
          view={progress.view}
          playerLevel={progress.level}
          visible={visible}
          selectedId={selectedId}
          routeIds={routeIds}
          favoriteIds={progress.favorites}
          nodeSize={progress.nodeSize}
          collapsed={progress.collapsed}
          onToggleCollapse={progress.toggleCollapsed}
          onSelect={setSelectedId}
        />
      </main>

      {route && (
        <PlannerBar
          route={route}
          locale={progress.locale}
          playerLevel={progress.level}
          onSelect={setSelectedId}
          onClear={() => setRouteTargetId(null)}
        />
      )}

      <DetailSheet
        tech={selectedId ? (data.byId.get(selectedId) ?? null) : null}
        data={data}
        locale={progress.locale}
        researched={progress.researched}
        favorites={progress.favorites}
        playerLevel={progress.level}
        onClose={() => setSelectedId(null)}
        onToggleResearched={progress.toggleResearched}
        onToggleFavorite={progress.toggleFavorite}
        onPlanRoute={(id) => {
          setRouteTargetId(id)
          setSelectedId(null)
        }}
      />
    </div>
  )
}
