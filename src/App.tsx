import { useEffect, useState } from "react"

import { iconUrl, loadTechData, type TechData } from "@/lib/data"
import { t } from "@/lib/i18n"
import type { Locale } from "@/types/tech"

/** Переключатель языка приедет в Фазе 3 вместе с useProgress. */
const LOCALE: Locale = "ru"

export default function App() {
  const [data, setData] = useState<TechData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTechData().then(setData, (cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    })
  }, [])

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-4 text-sm">
        <p className="text-destructive">{t("loadFailed", LOCALE)}</p>
        <pre className="mt-2 overflow-x-auto text-muted-foreground">{error}</pre>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-5xl p-4 text-sm text-muted-foreground">
        {t("loading", LOCALE)}
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="text-xl font-semibold">{t("appName", LOCALE)}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.technologies.length} {t("technologies", LOCALE)} ·{" "}
        {data.chains.chains.length} {t("chains", LOCALE)} · {data.recipes.size}{" "}
        {t("recipes", LOCALE)}
      </p>

      <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-2">
        {data.technologies.map((tech) => (
          <li key={tech.id} className="flex items-center gap-2 rounded-md border p-2">
            <img
              src={iconUrl(tech.id)}
              alt=""
              width={32}
              height={32}
              loading="lazy"
              className="size-8 shrink-0"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm">{tech.name[LOCALE]}</span>
              <span className="block text-xs text-muted-foreground">
                {t("levelShort", LOCALE)} {tech.level}
                {tech.ancient ? ` · ${t("ancient", LOCALE)}` : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
}
