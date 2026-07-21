"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/providers/auth-context"
import type { AuthFeedback, AuthMode } from "@/components/login/types"

export function useAuthFlow() {
  const router = useRouter()
  const { user, authLoading, signInDemo } = useAuth()

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
    if (!authLoading && user) router.push("/")
  }, [user, authLoading, router])

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode)
    setFeedback(null)
    setSignupSuccess(false)
    setPassword("")
  }, [])

  const handleSignIn = useCallback(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (!error) {
      router.push("/")
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
  }, [email, password, router, switchMode])

  const handleSignUp = useCallback(async () => {
    if (password.length < 6) {
      setFeedback({ type: "error", message: "Password must be at least 6 characters." })
      return
    }

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
      router.push("/")
    } else {
      setSignupSuccess(true)
      setFeedback(null)
    }
  }, [email, password, username, router, switchMode])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFeedback(null)
      setIsLoading(true)
      try {
        if (mode === "login") await handleSignIn()
        else await handleSignUp()
      } finally {
        setIsLoading(false)
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

  const handleDemoLogin = useCallback(() => {
    signInDemo()
    router.push("/")
  }, [signInDemo, router])

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
    handleDemoLogin,
  }
}
