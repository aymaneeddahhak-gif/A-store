/**
 * Fast circuit-breaker wrapper around `fetch` for Supabase clients.
 *
 * Why `Promise.race` + synthetic Response:
 * 1. On Windows/Node.js, DNS `getaddrinfo` for a paused/deleted `.supabase.co`
 *    host blocks in the libuv threadpool for ~12s and ignores AbortSignal until
 *    the OS lookup finishes. `Promise.race` resolves at 800ms without waiting.
 * 2. In the browser, persist the cooldown in sessionStorage so route changes and
 *    page reloads don't wait 800ms again while Supabase is paused.
 * 3. For `/auth/v1/` endpoints, return HTTP 400 (`invalid_grant`) when offline
 *    instead of 503 so `@supabase/auth-js` does NOT treat it as a retryable
 *    server outage or log `Console AuthRetryableFetchError`.
 */

const CIRCUIT_COOLDOWN_MS = 300_000 // 5 minutes
const FETCH_TIMEOUT_MS = 800
const SESSION_OFFLINE_KEY = "astore_supabase_offline_until"

const globalCircuit = globalThis as unknown as {
  __astoreSupabaseOfflineUntil?: number
}

function getOfflineUntil(): number {
  let until = globalCircuit.__astoreSupabaseOfflineUntil ?? 0
  if (typeof window !== "undefined") {
    try {
      const stored = Number(window.sessionStorage.getItem(SESSION_OFFLINE_KEY) ?? "0")
      if (stored > until) {
        until = stored
        globalCircuit.__astoreSupabaseOfflineUntil = stored
      }
    } catch {
      // Ignore storage access errors
    }
  }
  return until
}

export function isSupabaseOffline(): boolean {
  return getOfflineUntil() > Date.now()
}

export function markSupabaseOffline(): void {
  const until = Date.now() + CIRCUIT_COOLDOWN_MS
  globalCircuit.__astoreSupabaseOfflineUntil = until
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(SESSION_OFFLINE_KEY, String(until))
    } catch {
      // Ignore storage access errors
    }
  }
}

function isAuthEndpoint(input: RequestInfo | URL): boolean {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url
  return url.includes("/auth/v1/")
}

function offlineResponse(input: RequestInfo | URL): Response {
  if (isAuthEndpoint(input)) {
    return new Response(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "Supabase auth unavailable; demo session active.",
      }),
      {
        status: 400,
        statusText: "Bad Request",
        headers: { "Content-Type": "application/json" },
      }
    )
  }
  return new Response(
    JSON.stringify({
      message: "Supabase project is paused or unreachable",
      code: "SUPABASE_OFFLINE",
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
    }
  )
}

export function createResilientFetch(options?: { noStore?: boolean }): typeof fetch {
  return async (input, init) => {
    if (isSupabaseOffline()) {
      return offlineResponse(input)
    }

    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    const timeoutPromise = new Promise<Response>((resolve) => {
      timer = setTimeout(() => {
        markSupabaseOffline()
        controller.abort()
        resolve(offlineResponse(input))
      }, FETCH_TIMEOUT_MS)
    })

    const fetchPromise = fetch(input, {
      ...init,
      ...(options?.noStore ? { cache: "no-store" as RequestCache } : {}),
      signal: controller.signal,
    }).catch(() => {
      markSupabaseOffline()
      return offlineResponse(input)
    })

    try {
      return await Promise.race([fetchPromise, timeoutPromise])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
}
