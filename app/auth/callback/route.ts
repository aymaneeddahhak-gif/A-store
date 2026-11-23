import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createResilientFetch } from "@/lib/supabase-circuit"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const requestedNext = searchParams.get("next") ?? "/"
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { fetch: createResilientFetch({ noStore: true }) },
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("[Auth Callback] Code exchange failed:", error.message)
      return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  console.warn("[Auth Callback] No code in URL")
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
