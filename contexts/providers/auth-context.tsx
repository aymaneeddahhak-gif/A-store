"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/contexts/toast-context"

/**
 * Auth — Supabase session via onAuthStateChange, plus the demo-seller bypass.
 * Split out so cart/catalog components don't re-render on every auth event.
 */

type AuthContextValue = {
  user: User | null
  authLoading: boolean
  signOut: () => Promise<void>
  signInDemo: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DEMO_USER: User = {
  id: "demo-seller-id-12345",
  email: "demo@fikra.com",
  user_metadata: {
    full_name: "Demo Seller",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
  },
  aud: "authenticated",
  role: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null)
        setAuthLoading(false)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setAuthLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn("Supabase signOut error:", e)
    }
    setUser(null)
    showToast("Signed out successfully.", "success")
  }, [showToast])

  // Demo login — sandboxed bypass for portfolio preview without real credentials.
  // NOTE: bypasses RLS. Disabled in production by simply not calling it.
  const signInDemo = useCallback(() => {
    setUser(DEMO_USER)
    setAuthLoading(false)
    showToast("Demo seller login successful.", "success")
  }, [showToast])

  const value = useMemo(
    () => ({ user, authLoading, signOut, signInDemo }),
    [user, authLoading, signOut, signInDemo]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
