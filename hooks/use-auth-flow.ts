"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/providers/auth-context"
import { DEMO_ACCOUNTS, type DemoAccountId } from "@/lib/demo-accounts"
import { demoSessionLoginAction } from "@/lib/actions/demo-login"
import { isSellerEmail } from "@/lib/seller"
import type { AuthFeedback, AuthMode } from "@/components/login/types"

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
    async (signInEmail: string, signInPassword: string) => {
      const target = resolveNextPath()
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
        const msg = err instanceof Error ? err.message : "Could not reach Supabase Auth."
        setFeedback({ type: "error", message: msg })
      }
    },
    [router, switchMode]
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

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: username } },
      })

      if (error) {
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
      const msg = err instanceof Error ? err.message : "Could not reach Supabase Auth."
      setFeedback({ type: "error", message: msg })
    }
  }, [email, password, username, router, switchMode])

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
      setFeedback({ type: "error", message })
      setIsGoogleLoading(false)
    }
  }, [])

  const handleForgotPassword = useCallback(() => {
    setFeedback({
      type: "info",
      message: "Use your registered credentials or sign in with Google or one-click role cards above.",
    })
  }, [])

  const handleDemoLogin = useCallback(
    async (accountId: DemoAccountId) => {
      const account = DEMO_ACCOUNTS.find((a) => a.id === accountId)
      if (!account) return
      setFeedback(null)
      setIsLoading(true)
      const queryNext = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null
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
        setFeedback({ type: "error", message: res.error ?? "Sign-in failed." })
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("stop-delivery-loading"))
        }
      } catch {
        setFeedback({ type: "error", message: "Sign-in failed. Please try again." })
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
