import { createHmac, timingSafeEqual } from "crypto"
import { createServerClient } from "@supabase/ssr"
import type { User } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createResilientFetch, isSupabaseOffline } from "@/lib/supabase-circuit"

export const DEMO_USER_COOKIE = "astore_demo_user"
export const DEMO_SIG_COOKIE = "astore_demo_sig"

export interface DemoCookiePayload {
  id: string
  email: string
  full_name: string
  exp: number
}

function getDemoSigningSecret(): string | null {
  const secret =
    process.env.DEMO_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_DEMO_PASSWORD
  if (secret) return secret
  if (process.env.NODE_ENV === "production") return null
  return "astore-dev-demo-secret"
}

function toSyntheticUser(payload: { id?: string; email: string; full_name?: string }): User {
  const email = payload.email.toLowerCase()
  return {
    id: payload.id || `demo-${email.split("@")[0]}`,
    email,
    app_metadata: {},
    user_metadata: { full_name: payload.full_name || email.split("@")[0] },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User
}

export function signDemoCookiePayload(payload: {
  id: string
  email: string
  full_name: string
}): string {
  const secret = getDemoSigningSecret()
  if (!secret) {
    throw new Error("Demo session signing secret is not configured.")
  }
  const fullPayload: DemoCookiePayload = {
    id: payload.id,
    email: payload.email.toLowerCase(),
    full_name: payload.full_name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }
  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString("base64url")
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url")
  return `${encoded}.${sig}`
}

export function verifyDemoCookiePayload(raw: string | undefined): User | null {
  if (!raw) return null
  const secret = getDemoSigningSecret()
  if (!secret) return null
  const dot = raw.indexOf(".")
  if (dot <= 0) return null
  const encoded = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  if (!encoded || !sig) return null

  try {
    const expected = createHmac("sha256", secret)
      .update(encoded)
      .digest("base64url")
    const a = Buffer.from(sig, "utf8")
    const b = Buffer.from(expected, "utf8")
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null

    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as DemoCookiePayload
    if (!parsed?.email || typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return null
    }
    return toSyntheticUser(parsed)
  } catch {
    return null
  }
}

function parseLegacyDevCookie(raw: string | undefined): User | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as {
      id?: string
      email?: string
      full_name?: string
    }
    if (!parsed?.email) return null
    return toSyntheticUser({
      id: parsed.id,
      email: parsed.email,
      full_name: parsed.full_name,
    })
  } catch {
    return null
  }
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: createResilientFetch({ noStore: true }),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Called from a Server Component — writes are not allowed there.
          }
        },
      },
    }
  )

  const originalGetUser = client.auth.getUser.bind(client.auth)
  client.auth.getUser = (async (...args: Parameters<typeof originalGetUser>) => {
    const signedDemoUser = verifyDemoCookiePayload(cookieStore.get(DEMO_SIG_COOKIE)?.value)
    const devOfflineFallback =
      process.env.NODE_ENV !== "production" && isSupabaseOffline()
        ? parseLegacyDevCookie(cookieStore.get(DEMO_USER_COOKIE)?.value)
        : null

    if (isSupabaseOffline()) {
      const offlineUser = signedDemoUser ?? devOfflineFallback
      return { data: { user: offlineUser }, error: null } as unknown as Awaited<
        ReturnType<typeof originalGetUser>
      >
    }

    try {
      const res = await originalGetUser(...args)
      if (res.data?.user) return res
    } catch {
      // Fall through if Supabase became unreachable during the request
    }

    if (signedDemoUser) {
      return { data: { user: signedDemoUser }, error: null }
    }
    if (process.env.NODE_ENV !== "production" && isSupabaseOffline() && devOfflineFallback) {
      return { data: { user: devOfflineFallback }, error: null }
    }
    return { data: { user: null }, error: null } as unknown as Awaited<
      ReturnType<typeof originalGetUser>
    >
  }) as typeof originalGetUser

  return client
}
