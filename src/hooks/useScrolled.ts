import { useEffect, useState } from "react"

/**
 * Прокручена ли страница. Нужно шапкам: тень появляется только когда под
 * ними что-то уехало наверх — у самого верха страницы отделять нечего, и
 * постоянная тень читалась бы как рамка.
 */
export function useScrolled(threshold = 4): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [threshold])

  return scrolled
}
