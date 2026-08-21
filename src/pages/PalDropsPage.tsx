import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { BackToSections } from "@/components/BackToSections"
import { FLOATING_HEADER } from "@/components/Toolbar"
import { PageLoader } from "@/components/PageLoader"
import { SettingsSheet } from "@/components/SettingsSheet"
import { ResourceCard } from "@/components/drops/ResourceCard"
import { ResourceSheet } from "@/components/drops/ResourceSheet"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { TooltipProvider } from "@/components/ui/tooltip"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import type { ProgressState } from "@/hooks/useProgress"
import { t } from "@/lib/i18n"
import { filterResources } from "@/lib/drops"
import { loadDrops, peekDrops } from "@/lib/dropData"
import { loadPals, peekPals } from "@/lib/palData"
import type { DropsFile } from "@/types/drop"
import type { PalsFile } from "@/types/pal"

const CONTROL = "h-9 pointer-coarse:h-11"

interface PalDropsPageProps {
  progress: ProgressState
}

/** Раздел «Дроп с палов»: нужен ресурс — видно, кого фармить. */
export function PalDropsPage({ progress }: PalDropsPageProps) {
  const { locale } = progress
  const [drops, setDrops] = useState<DropsFile | null>(peekDrops)
  /** Палы нужны для имён и портретов источников — чанк общий с razделом навыков. */
  const [palsFile, setPalsFile] = useState<PalsFile | null>(peekPals)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const fail = (cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
    loadDrops().then(setDrops, fail)
    loadPals().then(setPalsFile, fail)
  }, [])

  const resources = useMemo(() => drops?.resources ?? [], [drops])
  const palsById = useMemo(
    () => new Map((palsFile?.pals ?? []).map((pal) => [pal.id, pal])),
    [palsFile],
  )

  const found = useMemo(
    () => filterResources(resources, query, locale),
    [resources, query, locale],
  )
  const deferredFound = useDeferredValue(found)

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-4 text-sm">
        <p className="text-destructive">{t("loadFailed", locale)}</p>
        <pre className="mt-2 overflow-x-auto text-muted-foreground">{error}</pre>
      </main>
    )
  }

  if (!drops || !palsFile) return <PageLoader locale={locale} />

  return (
    <TooltipProvider delay={250}>
      <div className="flex min-h-dvh flex-col">
        <header className={FLOATING_HEADER}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
            <BackToSections locale={locale} className={CONTROL} />

            <InputGroup className={`${CONTROL} min-w-48 flex-1 sm:w-72 sm:flex-none`}>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                className={CONTROL}
                value={query}
                placeholder={t("dropSearch", locale)}
                aria-label={t("dropSearch", locale)}
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>

            <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
              <span>
                {t("dropsFound", locale)}{" "}
                <span className="font-medium text-foreground tabular-nums">{found.length}</span>{" "}
                {t("ofTotal", locale)} <span className="tabular-nums">{resources.length}</span>
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
        </header>

        <main className="mx-auto flex w-full max-w-[110rem] flex-1 flex-col gap-3 p-3">
          <h1 className="sr-only">{t("sectionPalDrops", locale)}</h1>

          {deferredFound.length === 0 && deferredFound === found ? (
            <Empty className="py-12 animate-in fade-in-0 slide-in-from-bottom-3 animation-duration-300 fill-mode-both motion-reduce:animate-none">
              <EmptyHeader>
                <EmptyTitle>{t("dropsEmpty", locale)}</EmptyTitle>
                <EmptyDescription>{t("dropsEmptyHint", locale)}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {deferredFound.map((resource, index) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  locale={locale}
                  palsById={palsById}
                  index={index}
                  onSelect={setSelectedId}
                />
              ))}
            </ul>
          )}
        </main>

        <ResourceSheet
          resource={
            selectedId ? (resources.find((entry) => entry.id === selectedId) ?? null) : null
          }
          locale={locale}
          palsById={palsById}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </TooltipProvider>
  )
}
