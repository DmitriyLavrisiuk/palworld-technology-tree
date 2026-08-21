import { hitRange, type Range } from "@/lib/pals"
import { cn } from "@/lib/utils"

interface RangeCellsProps {
  cap: number
  range: Range | null
  label: string
  onChange: (range: Range | null) => void
}

/**
 * Ряд цифр для выбора диапазона. Жест живёт в `hitRange` и там же под тестом:
 * первый клик — «от», второй — «до», клик по единственной цифре снимает выбор.
 */
export function RangeCells({ cap, range, label, onChange }: RangeCellsProps) {
  return (
    <span className="inline-flex gap-1" role="group" aria-label={label}>
      {Array.from({ length: cap }, (_, index) => {
        const value = index + 1
        const inside = range !== null && value >= range.min && value <= range.max
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(hitRange(range, value))}
            aria-pressed={inside}
            className={cn(
              "grid size-6 place-items-center rounded-md border text-xs tabular-nums transition-colors",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              inside
                ? "border-transparent bg-primary font-medium text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {value}
          </button>
        )
      })}
    </span>
  )
}
