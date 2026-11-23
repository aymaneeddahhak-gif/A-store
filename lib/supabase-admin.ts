import "server-only"

import { createClient } from "@supabase/supabase-js"
import { createResilientFetch } from "@/lib/supabase-circuit"

/**
 * Service-role client for admin-only work (listing/managing auth users).
 * Server-only and never imported by client components. Returns null when
 * SUPABASE_SERVICE_ROLE_KEY is missing so callers can degrade gracefully
 * instead of crashing the route.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createResilientFetch({ noStore: true }) },
  })
}
