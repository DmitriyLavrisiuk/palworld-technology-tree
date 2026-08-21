import { EggIcon, NetworkIcon, PawPrintIcon } from "lucide-react"

import { SettingsSheet } from "@/components/SettingsSheet"
import { CONTROL } from "@/components/Toolbar"
import { Badge } from "@/components/ui/badge"
import type { ProgressState } from "@/hooks/useProgress"
import { t } from "@/lib/i18n"
import { PAL_SKILLS_HASH, RESEARCH_HASH } from "@/lib/sections"
import { cn } from "@/lib/utils"

type UiKey = Parameters<typeof t>[0]

/** Разделы в порядке готовности: рабочий первым. */
const SECTIONS: {
  key: string
  icon: typeof NetworkIcon
  title: UiKey
  hint: UiKey
  href: string | null
}[] = [
  {
    key: "research",
    icon: NetworkIcon,
    title: "sectionResearch",
    hint: "sectionResearchHint",
    href: RESEARCH_HASH,
  },
  {
    key: "palSkills",
    icon: PawPrintIcon,
    title: "sectionPalSkills",
    hint: "sectionPalSkillsHint",
    href: PAL_SKILLS_HASH,
  },
  { key: "breeding", icon: EggIcon, title: "sectionBreeding", hint: "sectionBreedingHint", href: null },
]

/**
 * Карточки всплывают по очереди. Классы перечислены литералами: Tailwind
 * сканирует исходники текстом и `delay-${n}` попросту не увидит — карточки
 * появились бы разом, молча, без ошибки сборки.
 *
 * Здесь `delay-*` — это `animation-delay`: tw-animate-css переопределяет
 * утилиту Tailwind. Для задержки перехода на наведении она не сработает.
 */
const APPEAR_DELAY = ["delay-0", "delay-75", "delay-150"]

const CARD = "flex h-full flex-col gap-2 rounded-lg border p-4"

interface SectionPickerProps {
  progress: ProgressState
}

/** Точка входа сайта: с чем сегодня работаем. */
export function SectionPicker({ progress }: SectionPickerProps) {
  const { locale } = progress

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Язык глобальный, и без этой кнопки переключить его с корня было бы
          нечем: до настроек пришлось бы идти внутрь раздела. */}
      <header className="flex items-center justify-end px-3 py-2">
        <SettingsSheet
          locale={locale}
          theme={progress.theme}
          nodeSize={progress.nodeSize}
          triggerClassName={CONTROL}
          onLocale={progress.setLocale}
          onTheme={progress.setTheme}
          onNodeSize={progress.setNodeSize}
        />
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-6 px-4 pb-16 sm:pb-24">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-medium">{t("appName", locale)}</h1>
          <p className="text-sm text-muted-foreground">{t("sectionsIntro", locale)}</p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section, index) => {
            const Icon = section.icon

            return (
              <li
                key={section.key}
                // Анимация живёт на обёртке, а подъём на наведении — на самой
                // карточке. На одном элементе они не уживаются: fill-mode
                // оставляет transform за анимацией, и hover перестаёт работать.
                className={cn(
                  "animate-in fade-in-0 slide-in-from-bottom-3 animation-duration-300 fill-mode-both",
                  "motion-reduce:animate-none",
                  APPEAR_DELAY[index],
                )}
              >
                {section.href ? (
                  <a
                    href={section.href}
                    className={cn(
                      CARD,
                      "bg-card transition-all duration-150",
                      "hover:border-ring hover:shadow-md motion-safe:hover:-translate-y-0.5",
                      "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                    )}
                  >
                    <Icon className="size-5 text-muted-foreground" aria-hidden />
                    <span className="text-sm font-medium">{t(section.title, locale)}</span>
                    <span className="text-sm text-muted-foreground">{t(section.hint, locale)}</span>
                  </a>
                ) : (
                  // Именно div, а не отключённая кнопка: раздела ещё нет, и
                  // ловить на него фокус незачем. «Скоро» — видимый текст, а не
                  // одна лишь приглушённость.
                  <div className={cn(CARD, "border-dashed")}>
                    <Icon className="size-5 text-muted-foreground/70" aria-hidden />
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
                      {t(section.title, locale)}
                      <Badge variant="secondary">{t("soon", locale)}</Badge>
                    </span>
                    <span className="text-sm text-muted-foreground">{t(section.hint, locale)}</span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
