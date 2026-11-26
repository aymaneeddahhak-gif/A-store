/**
 * Timeout wrapper around `fetch` for Supabase clients.
 * Prevents slow/unreachable DNS lookups from hanging server renders indefinitely.
 */

const DATA_FETCH_TIMEOUT_MS = 6000
const AUTH_FETCH_TIMEOUT_MS = 8000

export function isSupabaseOffline(): boolean {
  return false
}

export function resetSupabaseCircuit(): void {}

export function markSupabaseOffline(): void {}

function isAuthEndpoint(input: RequestInfo | URL): boolean {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url
  return url.includes("/auth/v1/")
}

export function createResilientFetch(options?: {
  noStore?: boolean
  timeoutMs?: number
  bypassCircuit?: boolean
}): typeof fetch {
  return async (input, init) => {
    const authCall = isAuthEndpoint(input)
    const timeoutMs =
      options?.timeoutMs ?? (authCall ? AUTH_FETCH_TIMEOUT_MS : DATA_FETCH_TIMEOUT_MS)
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    const timeoutPromise = new Promise<Response>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new Error("Supabase request timed out"))
      }, timeoutMs)
    })

    const fetchPromise = fetch(input, {
      ...init,
      ...(options?.noStore ? { cache: "no-store" as RequestCache } : {}),
      signal: controller.signal,
    })

    try {
      return await Promise.race([fetchPromise, timeoutPromise])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
}
