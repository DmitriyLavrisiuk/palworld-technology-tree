import { useSyncExternalStore } from "react"

import { sectionFromHash, type SectionId } from "@/lib/sections"

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

function getHash() {
  return window.location.hash
}

/**
 * Текущий раздел из адреса.
 *
 * `useSyncExternalStore`, а не пара `useState` + `useEffect`: хеш читается во
 * время рендера, поэтому заход по прямой ссылке сразу рисует нужный экран, без
 * кадра с экраном выбора, и между рендером и подпиской нет окна, в котором
 * смена адреса потерялась бы.
 *
 * Переходы делаются обычными ссылками `<a href="#/research">`: браузер сам
 * пишет историю и сам стреляет `hashchange`, поэтому «назад» и «открыть в новой
 * вкладке» работают даром. `history.pushState` события не порождает и потребовал
 * бы перехвата кликов — он здесь не нужен.
 */
export function useSection(): SectionId {
  return sectionFromHash(useSyncExternalStore(subscribe, getHash))
}
