import { useEffect, useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { BackToSections } from "@/components/BackToSections"
import { PageLoader } from "@/components/PageLoader"
import { SettingsSheet } from "@/components/SettingsSheet"
import { PalFilterBar } from "@/components/pals/PalFilterBar"
import { PalRow } from "@/components/pals/PalRow"
import { PalSheet } from "@/components/pals/PalSheet"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { TooltipProvider } from "@/components/ui/tooltip"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import type { ProgressState } from "@/hooks/useProgress"
import { t } from "@/lib/i18n"
import { loadPals, peekPals } from "@/lib/palData"
import {
  NO_PAL_FILTERS,
  buffGroupOf,
  filterPals,
  maxFood,
  maxWorkLevel,
  usedWorkKeys,
  type BuffFilterKey,
  type BuffGroup,
  type PalFilters,
  type Range,
} from "@/lib/pals"
import type { PalsFile, ElementKey, WorkKey } from "@/types/pal"

const CONTROL = "h-9 pointer-coarse:h-11"

interface PalSkillsPageProps {
  progress: ProgressState
}

/** Раздел «Навыки палов»: подбор пала под работы базы. */
export function PalSkillsPage({ progress }: PalSkillsPageProps) {
  const { locale } = progress
  const [data, setData] = useState<PalsFile | null>(peekPals)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  /** Фильтры живут только в сессии: это разовый запрос, а не настройка. */
  const [filters, setFilters] = useState<PalFilters>(NO_PAL_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    loadPals().then(setData, (cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    })
  }, [])

  // Через useMemo, а не выражением: иначе каждый рендер даёт новый массив,
  // и мемоизация отбора ниже перестаёт работать.
  const pals = useMemo(() => data?.pals ?? [], [data])
  const maxLevel = useMemo(() => maxWorkLevel(pals), [pals])
  const foodCap = useMemo(() => maxFood(pals), [pals])
  const workKeys = useMemo(() => usedWorkKeys(pals), [pals])

  /** Честные счётчики в панели усилителей — по всем палам, не по выдаче. */
  const buffCounts = useMemo(() => {
    const counts = new Map<BuffFilterKey, number>()
    for (const pal of pals) {
      const groups = pal.passives
        .map(buffGroupOf)
        .filter((group): group is BuffGroup => group !== null)
      if (groups.some((group) => group !== "penalty")) {
        counts.set("any", (counts.get("any") ?? 0) + 1)
      }
      for (const group of new Set(groups)) {
        counts.set(group, (counts.get(group) ?? 0) + 1)
      }
    }
    return counts
  }, [pals])

  const found = useMemo(
    () => filterPals(pals, filters, query, locale),
    [pals, filters, query, locale],
  )

  function toggleWork(key: WorkKey) {
    setFilters((previous) => {
      const works = new Map(previous.works)
      if (works.has(key)) works.delete(key)
      else works.set(key, null)
      return { ...previous, works }
    })
  }

  function setWorkRange(key: WorkKey, range: Range | null) {
    setFilters((previous) => {
      const works = new Map(previous.works)
      works.set(key, range)
      return { ...previous, works }
    })
  }

  function toggleElement(key: ElementKey) {
    setFilters((previous) => {
      const elements = new Set(previous.elements)
      if (elements.has(key)) elements.delete(key)
      else elements.add(key)
      return { ...previous, elements }
    })
  }

  function toggleBuff(key: BuffFilterKey) {
    setFilters((previous) => {
      // «Любой» — самодостаточный ответ: выбранные группы он поглощает.
      if (key === "any") {
        const buffs = previous.buffs.has("any")
          ? new Set<BuffFilterKey>()
          : new Set<BuffFilterKey>(["any"])
        return { ...previous, buffs }
      }
      const buffs = new Set(previous.buffs)
      buffs.delete("any")
      if (buffs.has(key)) buffs.delete(key)
      else buffs.add(key)
      return { ...previous, buffs }
    })
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-4 text-sm">
        <p className="text-destructive">{t("loadFailed", locale)}</p>
        <pre className="mt-2 overflow-x-auto text-muted-foreground">{error}</pre>
      </main>
    )
  }

  if (!data) return <PageLoader locale={locale} />

  return (
    <TooltipProvider delay={250}>
      <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
          <BackToSections locale={locale} className={CONTROL} />

          <InputGroup className={`${CONTROL} min-w-48 flex-1 sm:w-72 sm:flex-none`}>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              className={CONTROL}
              value={query}
              placeholder={t("palSearch", locale)}
              aria-label={t("palSearch", locale)}
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>

          <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span>
              {t("palsFound", locale)}{" "}
              <b className="text-foreground tabular-nums">{found.length}</b> {t("ofTotal", locale)}{" "}
              <span className="tabular-nums">{pals.length}</span>
            </span>
            <SettingsSheet
              locale={locale}
              theme={progress.theme}
              nodeSize={progress.nodeSize}
              triggerClassName={CONTROL}
              onLocale={progress.setLocale}
              onTheme={progress.setTheme}
              onNodeSize={progress.setNodeSize}
            />
          </span>
        </div>

        <PalFilterBar
          locale={locale}
          filters={filters}
          workNames={data.workNames}
          elementNames={data.elementNames}
          workKeys={workKeys}
          maxLevel={maxLevel}
          maxFood={foodCap}
          buffCounts={buffCounts}
          onToggleWork={toggleWork}
          onWorkRange={setWorkRange}
          onToggleElement={toggleElement}
          onFood={(range) => setFilters((previous) => ({ ...previous, food: range }))}
          onToggleBuff={toggleBuff}
          onReset={() => setFilters(NO_PAL_FILTERS)}
        />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 p-3">
        <h1 className="sr-only">{t("sectionPalSkills", locale)}</h1>

        {found.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>{t("palsEmpty", locale)}</EmptyTitle>
              <EmptyDescription>{t("palsEmptyHint", locale)}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <section className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              {t("palsFound", locale)}
              <Badge variant="secondary" className="tabular-nums">
                {found.length}
              </Badge>
            </h2>
            <ul className="flex flex-col gap-1.5">
              {found.map((pal) => (
                <PalRow
                  key={pal.id}
                  pal={pal}
                  locale={locale}
                  names={data.workNames}
                  elements={data.elementNames}
                  passives={data.passives}
                  works={filters.works}
                  foodCap={foodCap}
                  onSelect={setSelectedId}
                />
              ))}
            </ul>
          </section>
        )}
        </main>

        <PalSheet
          pal={selectedId ? (pals.find((pal) => pal.id === selectedId) ?? null) : null}
          locale={locale}
          names={data.workNames}
          elements={data.elementNames}
          passives={data.passives}
          maxLevel={maxLevel}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </TooltipProvider>
  )
}
