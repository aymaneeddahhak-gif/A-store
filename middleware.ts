import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createResilientFetch, isSupabaseOffline } from "@/lib/supabase-circuit"

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey || isSupabaseOffline()) {
    return response
  }

  // Only incur a Supabase session refresh round trip when a Supabase auth cookie exists
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"))
  if (!hasSupabaseCookie) {
    return response
  }

  try {
    const supabase = createServerClient(url, anonKey, {
      global: { fetch: createResilientFetch({ noStore: true }) },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    await supabase.auth.getUser()
  } catch {
    // Allow graceful fallback if Supabase is paused or unreachable
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|webm)$).*)",
  ],
}
