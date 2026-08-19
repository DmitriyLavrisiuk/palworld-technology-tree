import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"

const CACHE_DIR = ".cache"

/** paldb is a volunteer-run fan site — stay well under a request per second. */
const THROTTLE_MS = 220
const MAX_ATTEMPTS = 3

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

let chain: Promise<unknown> = Promise.resolve()

/** Serialises every network call and spaces them out. */
function throttled<T>(task: () => Promise<T>): Promise<T> {
  const result = chain.then(task)
  chain = result.then(
    () => sleep(THROTTLE_MS),
    () => sleep(THROTTLE_MS),
  )
  return result
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cachePath(url: string, ext: string) {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 16)
  return join(CACHE_DIR, `${hash}${ext}`)
}

export interface FetchOptions {
  /** Skip the on-disk cache and re-download. */
  fresh?: boolean
  /** Treat a 404 as an expected miss rather than an error. */
  allowMissing?: boolean
}

async function download(url: string, options: FetchOptions): Promise<Buffer | null> {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await throttled(() =>
        fetch(url, { headers: { "User-Agent": UA, Referer: "https://paldb.cc/" } }),
      )

      if (response.status === 404 && options.allowMissing) return null

      if (!response.ok) {
        // 4xx other than 404 will not fix itself — fail fast.
        if (response.status < 500 && response.status !== 429) {
          throw new Error(`HTTP ${response.status}`)
        }
        throw new Error(`HTTP ${response.status} (retryable)`)
      }

      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes("retryable") && !message.includes("fetch failed")) break
      if (attempt < MAX_ATTEMPTS) await sleep(attempt * 1200)
    }
  }

  throw new Error(`${url}: ${lastError instanceof Error ? lastError.message : lastError}`)
}

/**
 * Fetches a URL, caching the raw bytes on disk so re-runs cost nothing.
 * Returns null only when allowMissing is set and the page is a 404.
 */
export async function fetchBuffer(
  url: string,
  ext: string,
  options: FetchOptions = {},
): Promise<Buffer | null> {
  const path = cachePath(url, ext)

  if (!options.fresh && existsSync(path)) {
    const cached = await readFile(path)
    if (cached.length > 0) return cached
  }

  const body = await download(url, options)
  if (body === null) return null

  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, body)
  return body
}

export async function fetchText(url: string, options: FetchOptions = {}): Promise<string | null> {
  const body = await fetchBuffer(url, ".html", options)
  return body ? body.toString("utf8") : null
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const body = await fetchBuffer(url, ".json", options)
  if (!body) throw new Error(`${url}: empty response`)
  return JSON.parse(body.toString("utf8")) as T
}

/** Writes JSON with a trailing newline so diffs stay clean. */
export async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}
