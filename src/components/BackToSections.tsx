import { ArrowLeftIcon } from "lucide-react"

import { t } from "@/lib/i18n"
import { HOME_HASH } from "@/lib/sections"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"

interface BackToSectionsProps {
  locale: Locale
  className?: string
}

/**
 * Выход из раздела. Виден на любой ширине — прячется только подпись: у
 * пришедшего по прямой ссылке в истории вкладки может не быть предыдущей
 * записи, и без этой ссылки раздел стал бы ловушкой.
 */
export function BackToSections({ locale, className }: BackToSectionsProps) {
  return (
    <a
      href={HOME_HASH}
      aria-label={t("backToSections", locale)}
      title={t("backToSections", locale)}
      className={cn(
        "flex min-w-9 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors pointer-coarse:min-w-11",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <ArrowLeftIcon className="size-4" />
      <span className="hidden sm:inline">{t("backToSections", locale)}</span>
    </a>
  )
}
