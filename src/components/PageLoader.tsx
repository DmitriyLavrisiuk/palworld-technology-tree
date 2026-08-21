import { LoaderCircleIcon } from "lucide-react"

import { t } from "@/lib/i18n"
import type { Locale } from "@/types/tech"

interface PageLoaderProps {
  locale: Locale
}

/**
 * Загрузка раздела. Один вид на все разделы сайта: скелетон обещал бы
 * раскладку, а разделы у нас разные, и обещание было бы ложным в первом же
 * новом.
 *
 * Вращение не отключается при `prefers-reduced-motion`, в отличие от прочей
 * анимации в проекте: оно здесь единственный носитель смысла «идёт загрузка»,
 * а остановленный спиннер читается как зависший экран.
 */
export function PageLoader({ locale }: PageLoaderProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center" role="status" aria-busy>
      <LoaderCircleIcon className="size-8 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">{t("loading", locale)}</span>
    </main>
  )
}
