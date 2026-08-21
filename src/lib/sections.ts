/**
 * Разделы сайта и разбор адреса.
 *
 * Адрес живёт в хеше, а не в пути: GitHub Pages отдаёт `index.html` только на
 * корень подкаталога, поэтому обычный `/research` вернул бы 404 при F5 и по
 * прямой ссылке.
 *
 * Слово «маршрут» в проекте уже занято планировщиком (`buildRoute` — путь до
 * технологии), поэтому страницы называются разделами.
 */

export type SectionId = "home" | "research" | "pal-skills" | "pal-drops"

export const HOME_HASH = "#/"
export const RESEARCH_HASH = "#/research"
export const PAL_SKILLS_HASH = "#/pal-skills"
export const PAL_DROPS_HASH = "#/pal-drops"

/**
 * Смотрим только на первый сегмент. Второй зарезервирован под отложенный
 * диплинк на технологию (`#/research/pal-sphere`, см. ROADMAP): такая ссылка
 * уже сейчас приводит в раздел, а разбирать хвост будет сама страница.
 *
 * Любой неизвестный адрес ведёт на экран выбора, а не в пустоту: ссылка из
 * чужого сообщения должна показать, что на сайте вообще есть.
 */
export function sectionFromHash(hash: string): SectionId {
  const segment = hash.replace(/^#\/?/, "").split(/[/?]/)[0]
  if (segment === "research") return "research"
  if (segment === "pal-skills") return "pal-skills"
  if (segment === "pal-drops") return "pal-drops"
  return "home"
}
