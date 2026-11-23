import { createBrowserClient } from "@supabase/ssr"
import { createResilientFetch, isSupabaseOffline } from "@/lib/supabase-circuit"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: typeof window !== "undefined" && !isSupabaseOffline(),
    detectSessionInUrl: true,
  },
  global: {
    fetch: createResilientFetch(),
  },
})
