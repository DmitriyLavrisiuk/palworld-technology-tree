import { MAX_LEVEL } from "@/lib/constants"
import { cn } from "@/lib/utils"

/**
 * Липкая шкала над секцией; крупные деления каждые пять уровней. Прилипает
 * к верху своего контейнера прокрутки — CSS-трансформаций над ней быть не
 * должно, иначе `sticky` перестаёт работать (см. docs/UI_UX.md).
 */
export function LevelRuler({
  step,
  playerLevel,
  labelWidth,
}: {
  step: number
  playerLevel: number
  labelWidth: number
}) {
  const ticks = []

  for (let level = 1; level <= MAX_LEVEL; level++) {
    const major = level === 1 || level % 5 === 0
    const current = level === playerLevel

    ticks.push(
      <div
        key={level}
        className={cn(
          "flex shrink-0 items-center justify-center font-mono text-[10px] tabular-nums",
          major ? "font-semibold text-foreground" : "text-muted-foreground",
          current && "font-semibold text-synth",
        )}
        style={{ width: step }}
      >
        {major || current ? level : ""}
      </div>,
    )
  }

  return (
    <div className="sticky top-0 z-30 flex h-7 border-b bg-card">
      <div
        className="sticky left-0 z-10 shrink-0 border-r bg-card"
        style={{ width: labelWidth }}
      />
      <div className="flex">{ticks}</div>
    </div>
  )
}
