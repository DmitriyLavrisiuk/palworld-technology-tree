import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

interface FilterPopoverContentProps extends PopoverPrimitive.Popup.Props {
  className?: string
}

/**
 * Контент поповера фильтров, собранный из примитивов base-ui напрямую.
 *
 * Штатный `PopoverContent` не пробрасывает `positionMethod`, а `ui/` мы не
 * редактируем — композируем. `positionMethod="fixed"` здесь не косметика:
 * якорь-пилюля живёт в липкой шапке и относительно вьюпорта неподвижен, а
 * позиционер по умолчанию считает позицию от документа и на каждом кадре
 * прокрутки пересчитывал её с отставанием — меню дрожало.
 *
 * Заодно здесь живёт «жидкое стекло»: полупрозрачная подложка с блюром.
 */
export function FilterPopoverContent({ className, ...props }: FilterPopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align="start"
        sideOffset={4}
        positionMethod="fixed"
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 flex origin-(--transform-origin) flex-col rounded-lg p-2.5 text-sm text-popover-foreground outline-hidden",
            "border border-border/60 bg-popover/75 shadow-lg backdrop-blur-xl backdrop-saturate-150",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}
