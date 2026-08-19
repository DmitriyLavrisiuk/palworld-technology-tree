import { useEffect } from "react"

import type { Theme } from "@/hooks/useProgress"

/**
 * Тёмная тема у shadcn классовая (`@custom-variant dark (&:is(.dark *))`),
 * поэтому «системная» означает: следовать медиазапросу и продолжать следовать
 * за ним, пока пользователь не выбрал явно.
 */
export function useTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const apply = () => {
      root.classList.toggle("dark", theme === "dark" || (theme === "system" && media.matches))
    }

    apply()
    if (theme !== "system") return

    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [theme])
}
