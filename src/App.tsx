import { useEffect, useMemo, useState } from "react"

import { Toolbar } from "@/components/Toolbar"
import { DetailSheet } from "@/components/tree/DetailSheet"
import { PlannerBar } from "@/components/tree/PlannerBar"
import { TechTree } from "@/components/tree/TechTree"
import { Skeleton } from "@/components/ui/skeleton"
import { useProgress } from "@/hooks/useProgress"
import { useTheme } from "@/hooks/useTheme"
import { loadTechData, type TechData } from "@/lib/data"
import { buildRoute } from "@/lib/planner"
import { t } from "@/lib/i18n"
import { NO_FILTERS, researchedTotals, visibleTechs, type Filters } from "@/lib/tree"

export default function App() {
  const progress = useProgress()
  useTheme(progress.theme)

  const [data, setData] = useState<TechData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** Цель маршрута живёт только в сессии: в localStorage её не кладём. */
  const [routeTargetId, setRouteTargetId] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.lang = progress.locale
  }, [progress.locale])

  useEffect(() => {
    loadTechData().then(setData, (cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    })
  }, [])

  const visible = useMemo(
    () =>
      data
        ? visibleTechs(data.technologies, progress.researched, progress.level, query, filters)
        : [],
    [data, progress.researched, progress.level, query, filters],
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

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-4 text-sm">
        <p className="text-destructive">{t("loadFailed", progress.locale)}</p>
        <pre className="mt-2 overflow-x-auto text-muted-foreground">{error}</pre>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="flex flex-col gap-2 p-4" aria-busy>
        <span className="sr-only">{t("loading", progress.locale)}</span>
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-2/3" />
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-1.5">
          {Array.from({ length: 12 }, (_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-dvh">
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
        onQuery={setQuery}
        onView={progress.setView}
        onLevel={progress.setLevel}
        onLocale={progress.setLocale}
        onTheme={progress.setTheme}
        onFilters={setFilters}
      />

      <main>
        <h1 className="sr-only">{t("appName", progress.locale)}</h1>
        <TechTree
          data={data}
          locale={progress.locale}
          view={progress.view}
          playerLevel={progress.level}
          visible={visible}
          selectedId={selectedId}
          routeIds={routeIds}
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
        playerLevel={progress.level}
        onClose={() => setSelectedId(null)}
        onToggleResearched={progress.toggleResearched}
        onPlanRoute={(id) => {
          setRouteTargetId(id)
          setSelectedId(null)
        }}
      />
    </div>
  )
}
