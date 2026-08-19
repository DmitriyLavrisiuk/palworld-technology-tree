import { materialIconUrl } from "@/lib/data"
import { cn } from "@/lib/utils"
import type { Locale, RecipeMaterial } from "@/types/tech"

interface MaterialListProps {
  materials: RecipeMaterial[]
  locale: Locale
  className?: string
}

/** Материалы плитками с иконкой и количеством. Один вид в деталях и в маршруте. */
export function MaterialList({ materials, locale, className }: MaterialListProps) {
  return (
    <ul className={cn("grid grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-1.5", className)}>
      {materials.map((material) => (
        <li
          key={material.id}
          className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
        >
          <img
            src={materialIconUrl(material.id)}
            alt=""
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
            className="size-7 shrink-0 object-contain"
            // Иконки может не оказаться после патча игры: пустое место
            // лучше сломанной картинки.
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden"
            }}
          />
          <span className="min-w-0 flex-1 truncate text-xs" title={material.name[locale]}>
            {material.name[locale]}
          </span>
          <span className="shrink-0 font-mono text-xs font-medium tabular-nums">
            {material.count}
          </span>
        </li>
      ))}
    </ul>
  )
}
