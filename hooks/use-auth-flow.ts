"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/providers/auth-context"
import { DEMO_ACCOUNTS, type DemoAccountId } from "@/lib/demo-accounts"
import { demoSessionLoginAction } from "@/lib/actions/demo-login"
import { isSellerEmail } from "@/lib/seller"
import type { AuthFeedback, AuthMode } from "@/components/login/types"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function resolveNextPath(): string {
  if (typeof window === "undefined") return "/"
  const next = new URLSearchParams(window.location.search).get("next")
  if (next && next.startsWith("/") && !next.startsWith("//")) return next
  return "/"
}

function mapAuthErrorMessage(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("429")) {
    return "Too many attempts. Please wait a moment and try again."
  }
  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("timed out")) {
    return "Unable to reach the authentication server. Check your connection and try again."
  }
  return raw
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
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string
    email?: string
    password?: string
  }>({})
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
    setFieldErrors({})
    setSignupSuccess(false)
    setPassword("")
  }, [])

  const validateFields = useCallback((): boolean => {
    const errors: { username?: string; email?: string; password?: string } = {}
    const cleanEmail = email.trim()

    if (mode === "signup") {
      const cleanName = username.trim()
      if (!cleanName) errors.username = "Full name is required."
      else if (cleanName.length < 2) errors.username = "Full name must be at least 2 characters."
      else if (cleanName.length > 60) errors.username = "Full name must be under 60 characters."
    }

    if (!cleanEmail) {
      errors.email = "Email address is required."
    } else if (!EMAIL_RE.test(cleanEmail)) {
      errors.email = "Enter a valid email address (e.g. you@example.com)."
    }

    if (!password) {
      errors.password = "Password is required."
    } else if (mode === "signup") {
      if (!password.trim()) errors.password = "Password cannot be only spaces."
      else if (password.length < 6) errors.password = "Password must be at least 6 characters."
      else if (password.length > 72) errors.password = "Password must be 72 characters or fewer."
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [mode, username, email, password])

  const signInWithPassword = useCallback(
    async (signInEmail: string, signInPassword: string) => {
      const target = resolveNextPath()
      const cleanEmail = signInEmail.trim().toLowerCase()
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
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
          setFeedback({ type: "error", message: mapAuthErrorMessage(error.message) })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not reach authentication server."
        setFeedback({ type: "error", message: mapAuthErrorMessage(msg) })
      }
    },
    [router, switchMode]
  )

  const handleSignIn = useCallback(async () => {
    await signInWithPassword(email, password)
  }, [email, password, signInWithPassword])

  const handleSignUp = useCallback(async () => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = username.trim()
    const target = resolveNextPath()

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: cleanName },
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      })

      if (error) {
        if (error.message.includes("Password should be")) {
          setFeedback({ type: "error", message: "Password must be at least 6 characters." })
        } else if (error.message.toLowerCase().includes("already registered")) {
          setFeedback({
            type: "error",
            message: "An account with this email already exists.",
            action: {
              label: "Sign in instead",
              onClick: () => switchMode("login"),
            },
          })
        } else {
          setFeedback({ type: "error", message: mapAuthErrorMessage(error.message) })
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
      const msg = err instanceof Error ? err.message : "Could not reach authentication server."
      setFeedback({ type: "error", message: mapAuthErrorMessage(msg) })
    }
  }, [email, password, username, router, switchMode])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFeedback(null)
      if (!validateFields()) return

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
    [mode, validateFields, handleSignIn, handleSignUp]
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
        setFeedback({ type: "error", message: mapAuthErrorMessage(error.message) })
        setIsGoogleLoading(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed."
      setFeedback({ type: "error", message: mapAuthErrorMessage(message) })
      setIsGoogleLoading(false)
    }
  }, [])

  const handleForgotPassword = useCallback(async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: "Enter your account email first to receive a password reset link.",
      }))
      setFeedback({
        type: "info",
        message: "Enter your registered email above, then click Forgot password.",
      })
      return
    }

    setFeedback(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
      })
      if (error) {
        setFeedback({ type: "error", message: mapAuthErrorMessage(error.message) })
      } else {
        setFeedback({
          type: "info",
          message: `If an account exists for ${cleanEmail}, a password reset link has been sent.`,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send reset email."
      setFeedback({ type: "error", message: mapAuthErrorMessage(msg) })
    }
  }, [email])

  const handleDemoLogin = useCallback(
    async (accountId: DemoAccountId) => {
      const account = DEMO_ACCOUNTS.find((a) => a.id === accountId)
      if (!account) return
      setFeedback(null)
      setFieldErrors({})
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
    setEmail: (v: string) => {
      setEmail(v)
      setFieldErrors((prev) => (prev.email ? { ...prev, email: undefined } : prev))
    },
    password,
    setPassword: (v: string) => {
      setPassword(v)
      setFieldErrors((prev) => (prev.password ? { ...prev, password: undefined } : prev))
    },
    username,
    setUsername: (v: string) => {
      setUsername(v)
      setFieldErrors((prev) => (prev.username ? { ...prev, username: undefined } : prev))
    },
    fieldErrors,
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
