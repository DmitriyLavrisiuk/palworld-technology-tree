import { useEffect, useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { BackToSections } from "@/components/BackToSections"
import { PageLoader } from "@/components/PageLoader"
import { SettingsSheet } from "@/components/SettingsSheet"
import { PalRow } from "@/components/pals/PalRow"
import { WorkFilter } from "@/components/pals/WorkFilter"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import type { ProgressState } from "@/hooks/useProgress"
import { t } from "@/lib/i18n"
import { loadPals, peekPals } from "@/lib/palData"
import { filterPals, maxWorkLevel, usedWorkKeys } from "@/lib/pals"
import type { PalsFile, WorkKey } from "@/types/pal"

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
  /** Выбор живёт только в сессии: это разовый запрос, а не настройка. */
  const [required, setRequired] = useState<ReadonlyMap<WorkKey, number>>(new Map())

  useEffect(() => {
    loadPals().then(setData, (cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    })
  }, [])

  // Через useMemo, а не выражением: иначе каждый рендер даёт новый массив,
  // и мемоизация отбора ниже перестаёт работать.
  const pals = useMemo(() => data?.pals ?? [], [data])
  const maxLevel = useMemo(() => maxWorkLevel(pals), [pals])
  const works = useMemo(() => usedWorkKeys(pals), [pals])
  const found = useMemo(
    () => filterPals(pals, required, query, locale),
    [pals, required, query, locale],
  )

  function change(key: WorkKey, level: number | null) {
    setRequired((previous) => {
      const next = new Map(previous)
      if (level === null) next.delete(key)
      else next.set(key, level)
      return next
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
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-background/95 px-3 py-2 backdrop-blur">
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
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-3">
        <h1 className="sr-only">{t("sectionPalSkills", locale)}</h1>

        <WorkFilter
          locale={locale}
          names={data.workNames}
          required={required}
          works={works}
          maxLevel={maxLevel}
          onChange={change}
          onClear={() => setRequired(new Map())}
        />

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
                  required={required}
                />
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
