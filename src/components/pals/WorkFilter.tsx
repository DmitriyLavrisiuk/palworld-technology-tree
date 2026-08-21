import {
  DropletIcon,
  FlameIcon,
  FuelIcon,
  HammerIcon,
  HandIcon,
  PickaxeIcon,
  PillIcon,
  SnowflakeIcon,
  SproutIcon,
  TreePineIcon,
  TruckIcon,
  WheatIcon,
  ZapIcon,
} from "lucide-react"

import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"
import { WORK_ORDER, type WorkKey, type WorkNames } from "@/types/pal"

/**
 * Значки — из lucide, а не из игры. У paldb иконки работ пронумерованы
 * (`T_icon_palwork_04`), но чем какой номер является, нигде не записано:
 * сопоставлять пришлось бы на глаз, а это ровно та догадка, которую проект
 * старается не выдавать за данные. Подпись рядом снимает вопрос узнавания.
 */
const WORK_ICON: Record<WorkKey, typeof FlameIcon> = {
  EmitFlame: FlameIcon,
  Watering: DropletIcon,
  Seeding: SproutIcon,
  GenerateElectricity: ZapIcon,
  Handcraft: HammerIcon,
  Collection: HandIcon,
  Deforest: TreePineIcon,
  Mining: PickaxeIcon,
  OilExtraction: FuelIcon,
  ProductMedicine: PillIcon,
  Cool: SnowflakeIcon,
  Transport: TruckIcon,
  MonsterFarm: WheatIcon,
}

interface WorkFilterProps {
  locale: Locale
  names: WorkNames
  /** Требуемые уровни. Отсутствие ключа означает «работа не выбрана». */
  required: ReadonlyMap<WorkKey, number>
  maxLevel: number
  onChange: (key: WorkKey, level: number | null) => void
  onClear: () => void
}

/**
 * Выбор работ с требуемым уровнем.
 *
 * Уровень ставится одним кликом по цифре, а не перебором по кругу: сценарий
 * «добыча на пять и рубка на пять» должен занимать четыре клика, а не десять.
 * Шкала строится от фактического максимума в данных — в игре базовый потолок
 * четыре, но стихийные варианты доходят до восьми.
 */
export function WorkFilter({
  locale,
  names,
  required,
  maxLevel,
  onChange,
  onClear,
}: WorkFilterProps) {
  const levels = Array.from({ length: maxLevel }, (_, index) => index + 1)

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline gap-3">
        <h2 className="text-sm font-medium">{t("workFilterTitle", locale)}</h2>
        {required.size > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {t("workFilterClear", locale)}
          </button>
        )}
      </div>

      <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {WORK_ORDER.map((key) => {
          const Icon = WORK_ICON[key]
          const level = required.get(key) ?? null
          const active = level !== null

          return (
            <li
              key={key}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-2 transition-colors",
                active ? "border-ring bg-accent" : "bg-card",
              )}
            >
              <button
                type="button"
                onClick={() => onChange(key, active ? null : 1)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-9 items-center gap-2 rounded-md px-1 text-left text-sm transition-colors",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  active ? "font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{names[key][locale]}</span>
              </button>

              {/* Ряд уровней появляется только у выбранной работы: тринадцать
                  постоянных линеек из восьми цифр — это стена из ста цифр. */}
              {active && (
                <div className="flex flex-wrap gap-1" role="group" aria-label={names[key][locale]}>
                  {levels.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onChange(key, value)}
                      aria-pressed={level === value}
                      title={`${names[key][locale]} ${t("workAtLeast", locale)} ${value}`}
                      className={cn(
                        "grid size-7 place-items-center rounded-md border text-xs tabular-nums transition-colors",
                        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                        level === value
                          ? "border-transparent bg-primary font-medium text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export { WORK_ICON }
