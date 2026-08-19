import { load } from "cheerio"
import { fetchText } from "../lib/http.ts"
import type { GroupKey, Locale } from "../../src/types/tech.ts"

const BASE = "https://paldb.cc"

/**
 * Сегмент имени ассета → категория игры. Путь иконки несёт классификацию,
 * которую придумали не мы: `T_icon_buildObject_*`, `T_itemicon_Weapon_*`,
 * а снаряжение палов лежит в каталоге `PalIcon/`.
 *
 * Проверка, что это действительно данные, а не совпадение: множество
 * `structure` в точности равно множеству `category === "Structures"`.
 */
const ASSET_GROUP: Record<string, GroupKey> = {
  buildObject: "structure",
  Weapon: "weapon",
  Armor: "armor",
  Ammo: "ammo",
  Material: "material",
  Salvage: "material",
  Essential: "essential",
  Accessory: "accessory",
  PalSphere: "sphere",
  SphereModule: "sphere",
  Glider: "glider",
  Consume: "consumable",
  food: "consumable",
  Food: "consumable",
}

export function groupFromIcon(url: string): GroupKey {
  // Сёдла и снаряжение палов различаются каталогом, а не именем файла:
  // иконка там — портрет самого пала.
  if (url.includes("/PalIcon/")) return "palgear"

  const file = url.split("/").pop() ?? ""
  const segment = /^T_(?:itemicon|icon)_([A-Za-z0-9]+)/.exec(file)?.[1] ?? ""
  return ASSET_GROUP[segment] ?? "essential"
}

export interface PaldbTech {
  id: string
  name: string
  icon: string
  category: "Items" | "Structures"
  level: number
  cost: number
  ancient: boolean
  group: GroupKey
}

/**
 * The whole tree is one server-rendered page per locale — 588 nodes, one request.
 * `data-hover` carries the exact DataTable row key, which is what lets this join
 * losslessly to the game data.
 */
export async function fetchTechList(locale: Locale, fresh: boolean): Promise<PaldbTech[]> {
  const html = await fetchText(`${BASE}/${locale}/Technologies`, { fresh })
  if (!html) throw new Error("Technologies page returned nothing")

  const $ = load(html)
  const out: PaldbTech[] = []

  $(".hoverTech").each((_, element) => {
    const node = $(element)

    const hover = node.attr("data-hover") ?? ""
    const id = hover.split("Technology/")[1]
    if (!id) return

    const style = node.attr("style") ?? ""
    const icon = style.match(/url\(([^)]+)\)/)?.[1]?.replace(/['"]/g, "") ?? ""

    // The level label is the 32px-wide cell that opens each row.
    const levelText = node
      .closest(".d-flex.flex-wrap")
      .find("div[style*='width:32px']")
      .first()
      .text()
      .trim()

    const header = node.find(".hoverTechHeader").first().text().trim()

    out.push({
      id,
      name: node.find(".hoverTechFooter").first().text().trim(),
      icon,
      category: header === "Structures" ? "Structures" : "Items",
      level: Number(levelText),
      cost: Number(node.find(".hoverTechCost").first().text().trim()),
      ancient: (node.attr("class") ?? "").includes("BossTechnology"),
      group: groupFromIcon(icon),
    })
  })

  return out
}

/**
 * Material names come back from recipes as slugs plus English labels.
 * The item index gives the same slugs in any locale, so one request per
 * locale beats a lookup per material.
 */
export async function fetchItemNames(locale: Locale, fresh: boolean): Promise<Map<string, string>> {
  const html = await fetchText(`${BASE}/${locale}/Items`, { fresh })
  if (!html) throw new Error("Items page returned nothing")

  const $ = load(html)
  const names = new Map<string, string>()

  $("a.itemname").each((_, element) => {
    const anchor = $(element)
    const slug = anchor.attr("href")
    const label = anchor.text().trim()
    if (slug && label && !names.has(slug)) names.set(slug, label)
  })

  return names
}

export interface PaldbRecipe {
  /** Workbenches the item can be produced at. Empty for structures. */
  stations: string[]
  materials: { slug: string; name: string; icon: string; count: number }[]
}

/** paldb slugs are the display name with spaces turned into underscores. */
export function toSlug(name: string): string {
  return name.trim().replace(/\s+/g, "_")
}

/**
 * paldb is picky about percent-encoding and disagrees with both built-ins:
 * parentheses must be encoded (encodeURI/encodeURIComponent leave them raw,
 * and the server 404s), while an apostrophe must stay literal (encoding it
 * to %27 also 404s). Names like "Intermediate Fishing Rod (Cattiva)" and
 * "Lily's Spear" only resolve under exactly this combination.
 */
function encodeSlug(slug: string): string {
  return encodeURIComponent(slug)
    .replace(/[!()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%27/g, "'")
}

/**
 * Reads the "Production" card, which is the recipe for making this thing.
 * Deliberately not the "Crafting Materials" card — that one lists what the
 * item is consumed by, which is the opposite relation.
 */
export async function fetchRecipe(slug: string, fresh: boolean): Promise<PaldbRecipe | null> {
  const html = await fetchText(`${BASE}/en/${encodeSlug(slug)}`, { fresh, allowMissing: true })
  if (!html) return null

  const $ = load(html)

  // Language-independent anchor for the Production section.
  const heading = $('[data-i18n="convert_item_product_tab_title"]').first()
  if (!heading.length) return null

  const card = heading.closest(".card")
  const table = card.find("table").first()
  if (!table.length) return null

  const stations = card
    .find(".row a.itemname")
    .map((_, element) => $(element).text().trim())
    .get()
    .filter(Boolean)

  const cell = table.find("tbody tr").first().find("td").first()
  const materials: PaldbRecipe["materials"] = []

  // Two markup shapes exist: anchors wrapped in <span>, and anchors as bare
  // siblings. `nextAll` finds the quantity in both.
  cell.find("a.itemname").each((_, element) => {
    const anchor = $(element)
    const slugRef = anchor.attr("href")
    if (!slugRef) return

    const count = Number(anchor.nextAll("small.itemQuantity").first().text().trim())
    materials.push({
      slug: slugRef,
      name: anchor.text().trim(),
      // Иконка лежит прямо внутри ссылки на материал, поэтому за ней не нужно
      // ходить на отдельную страницу — она приезжает вместе с рецептом.
      icon: anchor.find("img").first().attr("src") ?? "",
      count: Number.isFinite(count) && count > 0 ? count : 1,
    })
  })

  if (!materials.length) return null
  return { stations, materials }
}
