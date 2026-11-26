"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import {
  demoSignOutAction,
  getSignedDemoSessionUserAction,
  updateDemoProfileMetadataAction,
} from "@/lib/actions/demo-login"
import { useToast } from "@/contexts/toast-context"

const DEMO_STORAGE_KEY = "astore_demo_user"
const DEMO_COOKIE_NAME = "astore_demo_user"

export interface DemoUserInput {
  id: string
  email: string
  fullName: string
  metadata?: Record<string, unknown>
}

function buildSyntheticUser(input: DemoUserInput): User {
  return {
    id: input.id,
    email: input.email.toLowerCase(),
    app_metadata: { provider: "email" },
    user_metadata: {
      ...(input.metadata ?? {}),
      full_name: (input.metadata?.full_name as string | undefined) || input.fullName,
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User
}

function readStoredDemoRecord(): DemoUserInput | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoUserInput
    if (!parsed?.email) return null
    return parsed
  } catch {
    return null
  }
}

function readStoredDemoUser(): User | null {
  const record = readStoredDemoRecord()
  return record ? buildSyntheticUser(record) : null
}

function hasStoredSupabaseAuth(): boolean {
  if (typeof window === "undefined") return false
  try {
    if (document.cookie.includes("sb-")) return true
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) return true
    }
    if (window.location.hash.includes("access_token") || window.location.search.includes("code=")) {
      return true
    }
  } catch {
    return false
  }
  return false
}

function writeDemoSession(input: DemoUserInput | null) {
  if (typeof window === "undefined") return
  try {
    // Clean up legacy global likes storage so likes never leak across users.
    window.localStorage.removeItem("justshop_likes")
    if (!input) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY)
      document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
    } else {
      const payload = JSON.stringify({
        id: input.id,
        email: input.email.toLowerCase(),
        full_name: input.fullName,
      })
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(input))
      document.cookie = `${DEMO_COOKIE_NAME}=${encodeURIComponent(payload)}; path=/; max-age=604800; SameSite=Lax`
    }
  } catch {
    // Ignore storage errors in restricted browsing modes
  }
}

type AuthContextValue = {
  user: User | null
  authLoading: boolean
  isDemoSession: boolean
  signInDemo: (input: DemoUserInput) => void
  updateProfileMetadata: (
    patch: Record<string, unknown>,
    options?: { password?: string }
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isDemoSession, setIsDemoSession] = useState(false)

  useEffect(() => {
    const storedDemo = readStoredDemoUser()
    if (storedDemo) {
      setUser(storedDemo)
      setIsDemoSession(true)
      setAuthLoading(false)
      // Revalidate signed cookie + hydrate fresh user_metadata from Supabase Auth.
      void getSignedDemoSessionUserAction().then((live) => {
        if (live) {
          writeDemoSession(live)
          setUser(buildSyntheticUser(live))
        } else {
          writeDemoSession(null)
          setUser(null)
          setIsDemoSession(false)
        }
      })
      return
    }

    if (!hasStoredSupabaseAuth()) {
      setUser(null)
      setIsDemoSession(false)
      setAuthLoading(false)
    } else {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          setUser(data.session?.user ?? null)
          setIsDemoSession(false)
          setAuthLoading(false)
        })
        .catch(() => {
          setAuthLoading(false)
        })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session?.user) {
          setUser(session.user)
          setIsDemoSession(false)
        }
        setAuthLoading(false)
      } else if (event === "SIGNED_OUT") {
        if (!readStoredDemoUser()) {
          setUser(null)
          setIsDemoSession(false)
        }
        setAuthLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInDemo = useCallback(
    (input: DemoUserInput) => {
      writeDemoSession(input)
      setUser(buildSyntheticUser(input))
      setIsDemoSession(true)
      setAuthLoading(false)
      showToast(`Signed in as ${input.fullName}`, "success")
    },
    [showToast]
  )

  const updateProfileMetadata = useCallback(
    async (
      patch: Record<string, unknown>,
      options?: { password?: string }
    ): Promise<{ error: string | null }> => {
      if (!user) return { error: "You must be signed in." }

      const demoRecord = readStoredDemoRecord()
      if (demoRecord || isDemoSession) {
        const res = await updateDemoProfileMetadataAction(patch, options)
        if (!res.ok) return { error: res.error || "Could not save profile to Supabase." }

        const nextMeta = res.metadata ?? { ...(user.user_metadata ?? {}), ...patch }
        const nextName =
          typeof nextMeta.full_name === "string" && nextMeta.full_name.trim()
            ? nextMeta.full_name.trim()
            : demoRecord?.fullName || "Customer"
        const nextRecord: DemoUserInput = {
          id: demoRecord?.id || user.id,
          email: demoRecord?.email || user.email || "",
          fullName: nextName,
          metadata: nextMeta,
        }
        writeDemoSession(nextRecord)
        setUser(buildSyntheticUser(nextRecord))
        return { error: null }
      }

      const { data, error } = await supabase.auth.updateUser({
        ...(options?.password ? { password: options.password } : {}),
        data: patch,
      })
      if (error) return { error: error.message }
      if (data.user) setUser(data.user)
      return { error: null }
    },
    [user, isDemoSession]
  )

  const signOut = useCallback(async () => {
    writeDemoSession(null)
    setIsDemoSession(false)
    try {
      await Promise.allSettled([demoSignOutAction(), supabase.auth.signOut()])
    } catch {
      // Ignore transient sign-out error
    }
    setUser(null)
    showToast("You have been signed out.", "success")
  }, [showToast])

  const value = useMemo(
    () => ({ user, authLoading, isDemoSession, signInDemo, updateProfileMetadata, signOut }),
    [user, authLoading, isDemoSession, signInDemo, updateProfileMetadata, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
