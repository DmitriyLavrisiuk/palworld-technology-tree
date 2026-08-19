import type { Chain, ChainConfidence, ChainKind, Bucket, GroupKey, Technology } from "../src/types/tech.ts"
import { BUCKET_PREFIXES } from "../src/lib/constants.ts"

/**
 * The game defines almost no tech-to-tech edges, so the chains a player wants
 * to see have to be synthesised. Order of authority, strongest first:
 *
 *   1. overrides          — hand-written families in chain-overrides.json.
 *   2. RequireTechnology  — the game's own 17 edges.
 *   3. Internal id stem   — ids are regular (Special_PalSphere_Grade_01..07).
 *   4. Shared id suffix   — Wooden_houseset / Stone_houseset / Metal_houseset.
 *   5. Display-name noun  — catches families the ids split up.
 *
 * Anything below `hard` is a guess; `confidence` marks where to look first.
 */

/** Tier markers, anywhere in the id. */
const TIER_MARKERS = [/_Grade_\d+/g, /_Tier_?\d+/g, /_Lv\d+/g]

/** Suffixes that mean "same tier, different climate/weight", not a next step. */
const VARIANT_SUFFIX = /_?(Heat|Cold|Weight)$/

const AMBIGUOUS_NOUNS = new Set([
  "Workbench", "Line", "Sphere", "Set", "Bed", "Box", "Stand",
  "Site", "Gun", "Pal", "I", "II", "III", "IV", "V",
])

const WEAPON_WORDS = /\b(bow|rifle|shotgun|sword|spear|gun|launcher|grenade|arrow|ammo|crossbow|handgun|missile|bomb|club|musket|knife|cleaver)\b/i
const ARMOR_WORDS = /\b(armor|outfit|helm|helmet|shield|garb|robe|band)\b/i
const TOOL_WORDS = /\b(axe|pickaxe|torch|net|rod|glider|parachute|lamp|lantern|grappling)\b/i

export interface ChainOverride {
  id: string
  group?: GroupKey
  kind?: ChainKind
  name?: { ru: string; en: string }
  members: string[]
  variants?: Record<string, string[]>
}

export interface OverrideFile {
  /** Hand-authored families. These win over every heuristic. */
  chains: ChainOverride[]
  /**
   * Ids the heuristics must not put in a chain. They still appear in the tree,
   * as standalone technologies — being wrongly grouped and being hidden are
   * different problems, and this file only fixes the first.
   */
  exclude?: string[]
}

function splitVariant(id: string): { base: string; variant: string } | null {
  const match = id.match(VARIANT_SUFFIX)
  if (!match) return null
  return { base: id.replace(VARIANT_SUFFIX, ""), variant: match[1] }
}

function stem(id: string): string {
  // Strip the variant suffix first, so a tier and its climate variants
  // land in the same cluster and can be split apart afterwards.
  let out = id.replace(VARIANT_SUFFIX, "")
  for (const marker of TIER_MARKERS) out = out.replace(marker, "")
  out = out.replace(/_?\d+$/, "")
  return out
}

/** Trailing id token: "Wooden_houseset" -> "houseset". */
function idSuffix(id: string): string {
  const parts = id.split("_")
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
}

/**
 * Апостроф остаётся частью слова: без этого "Lily's Spear" распадается на
 * три слова и цепочка получает имя "Lily s Spear". Таких названий 19.
 */
function words(name: string): string[] {
  return name.replace(/[^\p{L}\p{N}\s'\u2019]/gu, " ").trim().split(/\s+/).filter(Boolean)
}

function noun(name: string): string {
  const list = words(name)
  return list[list.length - 1] ?? ""
}

function capitalise(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text
}

/**
 * Longest run of words shared by the end of every member name.
 * "Wooden Structure Set" + "Stone Structure Set" -> "Structure Set".
 *
 * In Russian the shared tail often starts mid-phrase and lands in an oblique
 * case ("мешочек с кормом"), so the result is capitalised. Names that come out
 * genuinely wrong belong in chain-overrides.json.
 */
function commonTail(names: string[]): string {
  if (!names.length) return ""
  const split = names.map((name) => words(name))
  let tail: string[] = []

  for (let offset = 1; ; offset++) {
    const candidates = split.map((list) => list[list.length - offset])
    if (candidates.some((word) => !word)) break
    const first = candidates[0].toLowerCase()
    if (!candidates.every((word) => word.toLowerCase() === first)) break
    tail = [candidates[0], ...tail]
  }

  return capitalise(tail.join(" "))
}

function groupOf(tech: Technology): GroupKey {
  if (tech.category === "Structures") return "base"
  const name = tech.name.en
  if (ARMOR_WORDS.test(name)) return "armor"
  if (WEAPON_WORDS.test(name)) return "weapon"
  if (TOOL_WORDS.test(name)) return "tools"
  return "gear"
}

function dominantGroup(members: Technology[]): GroupKey {
  const tally = new Map<GroupKey, number>()
  for (const tech of members) {
    const key = groupOf(tech)
    tally.set(key, (tally.get(key) ?? 0) + 1)
  }
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

function sortMembers(members: Technology[]): Technology[] {
  return [...members].sort((a, b) => a.level - b.level || a.cost - b.cost)
}

export interface ChainBuildResult {
  chains: Chain[]
  buckets: Bucket[]
  loose: { group: GroupKey; members: string[] }[]
  stats: {
    total: number
    bucketed: number
    /** Ступени и варианты вместе: слагаемое разбиения всех технологий. */
    inChains: number
    /** Сколько из inChains — варианты, а не ступени. Информационно. */
    variants: number
    ungrouped: number
    byConfidence: Record<ChainConfidence, number>
  }
}

export function buildChains(
  technologies: Technology[],
  overrides: OverrideFile = { chains: [] },
): ChainBuildResult {
  const byId = new Map(technologies.map((tech) => [tech.id, tech]))
  const assigned = new Set<string>()
  const chains: Chain[] = []
  const usedIds = new Set<string>()
  let variantCount = 0

  /** Blocked from clustering, but still rendered — see OverrideFile.exclude. */
  const blocked = new Set(overrides.exclude ?? [])

  const resolve = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((tech): tech is Technology => Boolean(tech))

  const addChain = (
    members: Technology[],
    confidence: ChainConfidence,
    idHint: string,
    options: {
      variants?: Record<string, string[]>
      name?: { ru: string; en: string }
      group?: GroupKey
      kind?: ChainKind
    } = {},
  ) => {
    const ordered = sortMembers(members)
    ordered.forEach((tech) => assigned.add(tech.id))
    for (const list of Object.values(options.variants ?? {})) {
      list.forEach((id) => assigned.add(id))
      variantCount += list.length
    }

    let id = idHint || "chain"
    let suffix = 2
    while (usedIds.has(id)) id = `${idHint}-${suffix++}`
    usedIds.add(id)

    const first = ordered[0]

    /**
     * Russian names its tiers as single words ("Мегасфера", "Гигасфера"), so a
     * shared tail often does not exist. Falling back to the last member would
     * name the whole chain after its final tier — "Древний щит" for every
     * shield. The first member's noun generalises far better.
     */
    const nameFor = (locale: "en" | "ru") => {
      const tail = commonTail(ordered.map((tech) => tech.name[locale]))
      if (tail.length > 2) return tail
      // Russian nouns get short — "щит" is three letters and still the right name.
      const head = noun(first.name[locale])
      return head.length >= 3 ? capitalise(head) : first.name[locale]
    }

    chains.push({
      id,
      group: options.group ?? dominantGroup(ordered),
      name: options.name ?? { en: nameFor("en"), ru: nameFor("ru") },
      kind: options.kind ?? "chain",
      confidence,
      members: ordered.map((tech) => tech.id),
      ...(options.variants && Object.keys(options.variants).length
        ? { variants: options.variants }
        : {}),
    })
  }

  // --- Buckets: bulk with no upgrade semantics, pulled out before clustering.
  const buckets: Bucket[] = []
  const bucketNames = {
    saddles: { ru: "Сёдла и снаряжение палов", en: "Pal Saddles & Gear" },
    furniture: { ru: "Наборы мебели", en: "Furniture Sets" },
  } as const

  for (const [key, prefix] of Object.entries(BUCKET_PREFIXES)) {
    const members = technologies
      .filter((tech) => tech.id.startsWith(prefix) && !assigned.has(tech.id) && !blocked.has(tech.id))
      .sort((a, b) => a.level - b.level)
    if (!members.length) continue
    members.forEach((tech) => assigned.add(tech.id))
    buckets.push({
      id: key,
      name: bucketNames[key as keyof typeof bucketNames],
      members: members.map((tech) => tech.id),
    })
  }

  // --- Pass 1: hand-written families.
  for (const override of overrides.chains) {
    const members = resolve(override.members).filter((tech) => !assigned.has(tech.id))
    if (members.length < 2) continue
    const variants: Record<string, string[]> = {}
    for (const [base, list] of Object.entries(override.variants ?? {})) {
      const present = list.filter((id) => byId.has(id) && !assigned.has(id))
      if (present.length) variants[base] = present
    }
    addChain(members, "manual", override.id, {
      variants,
      name: override.name,
      group: override.group,
      kind: override.kind,
    })
  }

  // --- Pass 2: the game's own RequireTechnology edges, as connected components.
  const hardParent = new Map<string, string>()
  for (const tech of technologies) {
    if (tech.reqTech && byId.has(tech.reqTech) && !assigned.has(tech.id) && !blocked.has(tech.id)) {
      hardParent.set(tech.id, tech.reqTech)
    }
  }

  const rootOf = (id: string): string => {
    let current = id
    const guard = new Set<string>()
    while (hardParent.has(current) && !guard.has(current)) {
      guard.add(current)
      current = hardParent.get(current)!
    }
    return current
  }

  const hardComponents = new Map<string, Set<string>>()
  for (const id of hardParent.keys()) {
    const root = rootOf(id)
    if (!hardComponents.has(root)) hardComponents.set(root, new Set([root]))
    hardComponents.get(root)!.add(id)
  }

  for (const [root, ids] of hardComponents) {
    const members = resolve([...ids]).filter((tech) => !assigned.has(tech.id))
    if (members.length < 2) continue
    addChain(members, "hard", stem(root).toLowerCase())
  }

  /** Splits a cluster into base members and their climate/weight variants. */
  const withVariants = (members: Technology[]) => {
    const ids = new Set(members.map((tech) => tech.id))
    const bases: Technology[] = []
    const variants: Record<string, string[]> = {}

    for (const tech of members) {
      const split = splitVariant(tech.id)
      if (split && ids.has(split.base)) {
        ;(variants[split.base] ??= []).push(tech.id)
      } else {
        bases.push(tech)
      }
    }

    return { bases, variants }
  }

  /**
   * Quality gate for every guessed cluster: the members' display names must
   * share a trailing run of words. "Wooden/Stone/Metal Structure Set" passes on
   * "Structure Set"; "Pal Metal Pickaxe + Electric Furnace" — which id-suffix
   * clustering happily merges on the shared material token — does not.
   */
  const clusterInto = (
    keyOf: (tech: Technology) => string,
    confidence: ChainConfidence,
    guard: (key: string, members: Technology[]) => boolean,
  ) => {
    const groups = new Map<string, Technology[]>()
    for (const tech of technologies) {
      if (assigned.has(tech.id) || blocked.has(tech.id)) continue
      const key = keyOf(tech)
      if (!key) continue
      const list = groups.get(key)
      if (list) list.push(tech)
      else groups.set(key, [tech])
    }

    for (const [key, members] of groups) {
      if (!guard(key, members)) continue
      const { bases, variants } = withVariants(members)
      if (bases.length < 2) continue

      const tail = commonTail(bases.map((tech) => tech.name.en))
      if (tail.length <= 2) continue

      addChain(bases, confidence, key.toLowerCase(), { variants })
    }
  }

  // --- Pass 3: cluster on the internal id stem.
  clusterInto(
    (tech) => {
      const key = stem(tech.id)
      return key === tech.id ? "" : key
    },
    "stem",
    (_key, members) => members.length >= 2,
  )

  // --- Pass 4: cluster on a shared trailing id token.
  clusterInto(
    (tech) => idSuffix(tech.id),
    "stem",
    (key, members) => key.length > 3 && members.length >= 2 && members.length <= 10,
  )

  // --- Pass 5: cluster on the display-name noun.
  clusterInto(
    (tech) => {
      const key = noun(tech.name.en)
      return AMBIGUOUS_NOUNS.has(key) ? "" : key
    },
    "name",
    // A "family" of more than eight is almost always a false merge.
    (_key, members) => members.length >= 2 && members.length <= 8,
  )

  const looseTechs = technologies.filter((tech) => !assigned.has(tech.id))
  const looseByGroup = new Map<GroupKey, string[]>()
  for (const tech of looseTechs) {
    const key = groupOf(tech)
    const list = looseByGroup.get(key)
    if (list) list.push(tech.id)
    else looseByGroup.set(key, [tech.id])
  }
  const loose = [...looseByGroup.entries()].map(([group, members]) => ({ group, members }))

  /**
   * Вариант (жара/холод/вес) — такой же узел цепочки, как и её ступень,
   * просто стоит сбоку. Не считать его значит потерять 19 узлов: сумма
   * inChains + bucketed + ungrouped обязана давать total.
   */
  const nodesIn = (chain: Chain) =>
    chain.members.length + Object.values(chain.variants ?? {}).flat().length

  const byConfidence: Record<ChainConfidence, number> = { hard: 0, stem: 0, name: 0, manual: 0 }
  for (const chain of chains) byConfidence[chain.confidence] += nodesIn(chain)

  return {
    chains: chains.sort((a, b) => a.group.localeCompare(b.group) || a.id.localeCompare(b.id)),
    buckets,
    loose,
    stats: {
      total: technologies.length,
      bucketed: buckets.reduce((sum, bucket) => sum + bucket.members.length, 0),
      inChains: chains.reduce((sum, chain) => sum + nodesIn(chain), 0),
      variants: variantCount,
      ungrouped: looseTechs.length,
      byConfidence,
    },
  }
}
