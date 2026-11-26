import { createBrowserClient } from "@supabase/ssr"
import { createResilientFetch } from "@/lib/supabase-circuit"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: true,
  },
  global: {
    fetch: createResilientFetch(),
  },
})
