import { workIconUrl } from "@/lib/palData"
import { cn } from "@/lib/utils"
import type { WorkKey } from "@/types/pal"

interface WorkIconProps {
  work: WorkKey
  /** Подпись для нативной подсказки; не нужна, когда рядом стоит Tooltip. */
  title?: string
  className?: string
}

/**
 * Значок работы — картинка из игры. Соответствие «файл → ключ» установлено
 * парсером по атрибуту `data-i18n` на paldb, а не подобрано на глаз.
 */
export function WorkIcon({ work, title, className }: WorkIconProps) {
  return (
    <img
      src={workIconUrl(work)}
      alt=""
      title={title}
      width={24}
      height={24}
      decoding="async"
      className={cn("size-6 shrink-0 object-contain", className)}
      // Работы без иконки не бывает, но после патча файл может пропасть:
      // пустое место лучше значка сломанной картинки.
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden"
      }}
    />
  )
}
