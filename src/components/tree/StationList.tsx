import { stationIconUrl } from "@/lib/data"
import { cn } from "@/lib/utils"
import type { Locale, RecipeStation } from "@/types/tech"

interface StationListProps {
  stations: RecipeStation[]
  locale: Locale
  className?: string
}

/**
 * Где делается — тем же видом, что и материалы: иконка плюс название.
 * У станций восемь-девять вариантов на один предмет, и строкой через запятую
 * они читались как абзац.
 */
export function StationList({ stations, locale, className }: StationListProps) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {stations.map((station) => (
        <li
          key={station.id}
          className="flex items-center gap-1.5 rounded-full border bg-card py-1 pr-2.5 pl-1"
        >
          <img
            src={stationIconUrl(station.id)}
            alt=""
            width={20}
            height={20}
            // Не lazy: панель только что открыли, иконок здесь десяток, и в
            // общей очереди с 588 плитками дерева они ждали много секунд.
            fetchPriority="high"
            decoding="async"
            className="size-5 shrink-0 object-contain"
            // Иконки может не оказаться после патча игры: пустое место
            // лучше сломанной картинки.
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden"
            }}
          />
          <span className="text-xs">{station.name[locale]}</span>
        </li>
      ))}
    </ul>
  )
}
