"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/contexts/toast-context"

/**
 * Auth — Supabase session via onAuthStateChange. Split out so cart/catalog
 * components don't re-render on every auth event.
 */

type AuthContextValue = {
  user: User | null
  authLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // Fast path: getSession resolves from the local storage session without a
    // network round trip, so auth-gated pages stop blocking on Supabase's
    // INITIAL_SESSION event. The subscription below stays the source of truth
    // for later sign-ins/outs.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null)
        setAuthLoading(false)
      })
      .catch(() => setAuthLoading(false))

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
    } catch {
      // The local session is cleared regardless, so a failed network round trip
      // must not leave the user apparently signed in.
    }
    setUser(null)
    showToast("You have been signed out.", "success")
  }, [showToast])

  const value = useMemo(
    () => ({ user, authLoading, signOut }),
    [user, authLoading, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
