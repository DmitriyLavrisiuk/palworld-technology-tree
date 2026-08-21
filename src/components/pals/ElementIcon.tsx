import { elementIconUrl } from "@/lib/palData"
import { cn } from "@/lib/utils"
import type { ElementKey } from "@/types/pal"

interface ElementIconProps {
  element: ElementKey
  title?: string
  className?: string
}

/**
 * Значок стихии — картинка из игры. Соответствие «файл → стихия» выведено
 * парсером сверкой строк paldb с игровой таблицей, а не подобрано на глаз.
 */
export function ElementIcon({ element, title, className }: ElementIconProps) {
  return (
    <img
      src={elementIconUrl(element)}
      alt=""
      title={title}
      width={20}
      height={20}
      decoding="async"
      className={cn("size-6 shrink-0 object-contain", className)}
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden"
      }}
    />
  )
}
