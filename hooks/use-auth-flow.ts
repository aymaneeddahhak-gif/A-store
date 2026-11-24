"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { resetSupabaseCircuit } from "@/lib/supabase-circuit"
import { useAuth } from "@/contexts/providers/auth-context"
import { DEMO_ACCOUNTS, type DemoAccountId } from "@/lib/demo-accounts"
import { demoSessionLoginAction } from "@/lib/actions/demo-login"
import { isSellerEmail } from "@/lib/seller"
import type { AuthFeedback, AuthMode } from "@/components/login/types"

function isNetworkOrOfflineError(msg: string): boolean {
  return /fetch failed|network|circuit open|paused or unreachable|supabase_offline|supabase auth offline|supabase auth unavailable|demo session|unreachable|timed? ?out|failed to fetch|enotfound|offline demo/i.test(
    msg
  )
}

function resolveNextPath(): string {
  if (typeof window === "undefined") return "/"
  const next = new URLSearchParams(window.location.search).get("next")
  if (next && next.startsWith("/") && !next.startsWith("//")) return next
  return "/"
}

export function useAuthFlow() {
  const router = useRouter()
  const { user, authLoading, signInDemo } = useAuth()
  const redirectingRef = useRef(false)

  const [mode, setMode] = useState<AuthMode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Only auto-redirect already-signed-in visitors who land on /login directly;
  // allow signed-in non-sellers to stay on /login when switching to a Seller account.
  useEffect(() => {
    if (!authLoading && user && !redirectingRef.current) {
      const params =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
      const target = resolveNextPath()
      const wantsSwitch = params?.get("switch") === "1"
      const customerSeekingSeller = target === "/seller" && !isSellerEmail(user.email)
      if (wantsSwitch || customerSeekingSeller) return
      redirectingRef.current = true
      router.replace(target)
    }
  }, [user, authLoading, router])

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode)
    setFeedback(null)
    setSignupSuccess(false)
    setPassword("")
  }, [])

  const signInWithPassword = useCallback(
    async (signInEmail: string, signInPassword: string, fallbackName?: string) => {
      const target = resolveNextPath()
      resetSupabaseCircuit()
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: signInEmail,
          password: signInPassword,
        })

        if (!error) {
          redirectingRef.current = true
          router.push(target)
          router.refresh()
          return
        }

        if (isNetworkOrOfflineError(error.message)) {
          const cleanEmail = signInEmail.trim().toLowerCase()
          redirectingRef.current = true
          signInDemo({
            id: cleanEmail.includes("admin") ? "demo-admin-role-id" : `demo-${cleanEmail.split("@")[0]}`,
            email: cleanEmail,
            fullName: fallbackName || cleanEmail.split("@")[0] || "Demo User",
          })
          router.push(target)
          router.refresh()
          return
        }

        if (error.message.includes("Invalid login credentials")) {
          setFeedback({
            type: "error",
            message: "Incorrect email or password.",
            action: {
              label: "Don't have an account? Sign up",
              onClick: () => switchMode("signup"),
            },
          })
        } else if (error.message.includes("Email not confirmed")) {
          setFeedback({
            type: "info",
            message: "Please verify your email first. Check your inbox for a confirmation link.",
          })
        } else {
          setFeedback({ type: "error", message: error.message })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error"
        if (isNetworkOrOfflineError(msg)) {
          const cleanEmail = signInEmail.trim().toLowerCase()
          redirectingRef.current = true
          signInDemo({
            id: cleanEmail.includes("admin") ? "demo-admin-role-id" : `demo-${cleanEmail.split("@")[0]}`,
            email: cleanEmail,
            fullName: fallbackName || cleanEmail.split("@")[0] || "Demo User",
          })
          router.push(target)
          router.refresh()
          return
        }
        setFeedback({ type: "error", message: msg })
      }
    },
    [router, switchMode, signInDemo]
  )

  const handleSignIn = useCallback(async () => {
    await signInWithPassword(email, password)
  }, [email, password, signInWithPassword])

  const handleSignUp = useCallback(async () => {
    if (password.length < 6) {
      setFeedback({ type: "error", message: "Password must be at least 6 characters." })
      return
    }
    const target = resolveNextPath()
    resetSupabaseCircuit()

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: username } },
      })

      if (error) {
        if (isNetworkOrOfflineError(error.message)) {
          const cleanEmail = email.trim().toLowerCase()
          redirectingRef.current = true
          signInDemo({
            id: `demo-${cleanEmail.split("@")[0]}`,
            email: cleanEmail,
            fullName: username.trim() || cleanEmail.split("@")[0] || "Shopper",
          })
          router.push(target)
          router.refresh()
          return
        }
        if (error.message.includes("Password should be")) {
          setFeedback({ type: "error", message: "Password must be at least 6 characters." })
        } else {
          setFeedback({ type: "error", message: error.message })
        }
        return
      }

      if (data.user?.identities?.length === 0) {
        setFeedback({
          type: "error",
          message: "An account with this email already exists.",
          action: {
            label: "Sign in instead",
            onClick: () => switchMode("login"),
          },
        })
        return
      }

      if (data.session) {
        redirectingRef.current = true
        router.push(target)
        router.refresh()
      } else {
        setSignupSuccess(true)
        setFeedback(null)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error"
      if (isNetworkOrOfflineError(msg)) {
        const cleanEmail = email.trim().toLowerCase()
        redirectingRef.current = true
        signInDemo({
          id: `demo-${cleanEmail.split("@")[0]}`,
          email: cleanEmail,
          fullName: username.trim() || cleanEmail.split("@")[0] || "Shopper",
        })
        router.push(target)
        router.refresh()
        return
      }
      setFeedback({ type: "error", message: msg })
    }
  }, [email, password, username, router, switchMode, signInDemo])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFeedback(null)
      setIsLoading(true)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("start-delivery-loading", {
          detail: { message: mode === "login" ? "Signing In" : "Creating Account" }
        }))
      }
      try {
        if (mode === "login") await handleSignIn()
        else await handleSignUp()
      } finally {
        setIsLoading(false)
        if (!redirectingRef.current && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("stop-delivery-loading"))
        }
      }
    },
    [mode, handleSignIn, handleSignUp]
  )

  const handleGoogleLogin = useCallback(async () => {
    setFeedback(null)
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setFeedback({ type: "error", message: error.message })
        setIsGoogleLoading(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed."
      setFeedback({
        type: "info",
        message: isNetworkOrOfflineError(message)
          ? "Supabase OAuth is offline right now — use the 1-Click Demo buttons below to sign in instantly."
          : message,
      })
      setIsGoogleLoading(false)
    }
  }, [])

  const handleForgotPassword = useCallback(() => {
    setFeedback({
      type: "info",
      message: "Password reset is disabled in this portfolio demo — use a 1-click demo account below.",
    })
  }, [])

  const handleDemoLogin = useCallback(
    async (accountId: DemoAccountId) => {
      const account = DEMO_ACCOUNTS.find((a) => a.id === accountId)
      if (!account) return
      setFeedback(null)
      setIsLoading(true)
      const queryNext = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null
      // Auto-guide Normal User to /profile and Demo Seller to /seller;
      // never send a Normal User straight to the seller-only gate after login.
      const defaultTarget = accountId === "customer" ? "/profile" : "/seller"
      const target =
        queryNext &&
        queryNext.startsWith("/") &&
        !queryNext.startsWith("//") &&
        queryNext !== "/" &&
        !(accountId === "customer" && queryNext.startsWith("/seller"))
          ? queryNext
          : defaultTarget
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("start-delivery-loading", {
          detail: { label: target === "/profile" ? "Your Profile & Orders" : "Seller Dashboard" }
        }))
      }
      try {
        const res = await demoSessionLoginAction(accountId)
        if (res.ok && res.user) {
          redirectingRef.current = true
          signInDemo(res.user)
          router.push(target)
          router.refresh()
          return
        }
        setFeedback({ type: "error", message: res.error ?? "Demo sign-in failed." })
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("stop-delivery-loading"))
        }
      } catch {
        setFeedback({ type: "error", message: "Demo sign-in failed. Please try again." })
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("stop-delivery-loading"))
        }
      } finally {
        setIsLoading(false)
      }
    },
    [router, signInDemo]
  )

  return {
    mode,
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    feedback,
    isLoading,
    isGoogleLoading,
    signupSuccess,
    authLoading,
    user,
    switchMode,
    handleSubmit,
    handleGoogleLogin,
    handleForgotPassword,
    handleDemoLogin,
  }
}
