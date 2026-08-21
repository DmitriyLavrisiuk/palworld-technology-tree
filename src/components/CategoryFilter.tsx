import { CheckIcon, LayersIcon } from "lucide-react"

import { FilterPopoverContent } from "@/components/FilterPopoverContent"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { GROUP_NAMES, GROUP_ORDER } from "@/lib/constants"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { GroupKey, Locale } from "@/types/tech"

interface CategoryFilterProps {
  locale: Locale
  selected: ReadonlySet<GroupKey>
  counts: ReadonlyMap<GroupKey, number>
  className?: string
  onToggle: (group: GroupKey) => void
  onClear: () => void
}

/**
 * Категорий одиннадцать — рядом чипов они заняли бы на телефоне три строки,
 * а шапку мы только что сжимали. Поэтому список живёт в поповере, а на
 * пилюле видно, сколько категорий выбрано.
 *
 * Пустой выбор означает «все»: так фильтр выключен по умолчанию и не требует
 * перечислять одиннадцать пунктов при первом запуске.
 */
export function CategoryFilter({
  locale,
  selected,
  counts,
  className,
  onToggle,
  onClear,
}: CategoryFilterProps) {
  const active = selected.size > 0

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3.5 text-xs whitespace-nowrap transition-colors",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          active
            ? "border-transparent bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className,
        )}
      >
        <LayersIcon className="size-3.5" />
        {t("categories", locale)}
        {active && <span className="tabular-nums">{selected.size}</span>}
      </PopoverTrigger>

      <FilterPopoverContent className="w-64 p-1">
        <ul className="flex flex-col">
          {GROUP_ORDER.map((group) => {
            const checked = selected.has(group)
            return (
              <li key={group}>
                <button
                  type="button"
                  onClick={() => onToggle(group)}
                  aria-pressed={checked}
                  className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none pointer-coarse:min-h-11"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-[4px] border",
                      checked && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {checked && <CheckIcon className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{GROUP_NAMES[group][locale]}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {counts.get(group) ?? 0}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {active && (
          <button
            type="button"
            onClick={onClear}
            className="mt-1 flex min-h-9 w-full items-center justify-center rounded-md border text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground pointer-coarse:min-h-11"
          >
            {t("categoriesAll", locale)}
          </button>
        )}
      </FilterPopoverContent>
    </Popover>
  )
}
