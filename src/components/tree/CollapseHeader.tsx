import type { ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface CollapseHeaderProps {
  collapsed: boolean
  onToggle: () => void
  /** Доступное имя кнопки: содержимое может быть версткой без внятного текста. */
  label: string
  children: ReactNode
  className?: string
}

/**
 * Заголовок со шевроном. Своё, а не `accordion.tsx`: тот оборачивает
 * содержимое в `overflow-hidden` с анимацией высоты, что убивает
 * `position: sticky` внутри и обрезает горизонтальное полотно «Шкалы».
 * По той же причине здесь нет анимации — содержимое просто не рендерится.
 */
export function CollapseHeader({
  collapsed,
  onToggle,
  label,
  children,
  className,
}: CollapseHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={label}
      className={cn(
        "flex min-h-11 w-full items-center gap-1.5 rounded-md px-1 text-left transition-colors",
        "hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <ChevronDownIcon
        aria-hidden
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform",
          collapsed && "-rotate-90",
        )}
      />
      {children}
    </button>
  )
}
