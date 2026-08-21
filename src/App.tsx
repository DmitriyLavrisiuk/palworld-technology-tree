import { useEffect, useRef } from "react"

import { useProgress } from "@/hooks/useProgress"
import { useSection } from "@/hooks/useSection"
import { useTheme } from "@/hooks/useTheme"
import { t } from "@/lib/i18n"
import { ResearchPage } from "@/pages/ResearchPage"
import { SectionPicker } from "@/pages/SectionPicker"

/**
 * Оболочка сайта: держит то, что общее для всех разделов, — прогресс, тему,
 * язык и текущий адрес. Всё остальное живёт в самих разделах.
 *
 * `useProgress` вызывается здесь и только здесь: он владеет единственной
 * записью в localStorage, и второй экземпляр расщепил бы состояние надвое.
 * Поэтому объект уходит в раздел пропом.
 */
export default function App() {
  const progress = useProgress()
  useTheme(progress.theme)
  const section = useSection()

  useEffect(() => {
    document.documentElement.lang = progress.locale
    document.title = t(section === "research" ? "titleResearch" : "appName", progress.locale)
  }, [progress.locale, section])

  // Прокрутка сбрасывается только при настоящей смене раздела: на первом
  // рендере это отняло бы у браузера восстановление позиции после F5.
  const previousSection = useRef(section)
  useEffect(() => {
    if (previousSection.current === section) return
    previousSection.current = section
    window.scrollTo(0, 0)
  }, [section])

  if (section === "research") return <ResearchPage progress={progress} />

  return <SectionPicker progress={progress} />
}
