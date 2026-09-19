"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { LoginShowcase } from "@/components/login/login-showcase"
import { SignupSuccess } from "@/components/login/signup-success"
import { AuthForm } from "@/components/login/auth-form"
import { AuthSkeleton } from "@/components/loading-skeletons"
import { useAuthFlow } from "@/hooks/use-auth-flow"

export function LoginPageClient() {
  const flow = useAuthFlow()

  if (flow.authLoading) {
    return <AuthSkeleton />
  }

  if (flow.user) {
    // Signed in — the flow is already navigating; hold the skeleton instead
    // of a blank frame while router.push completes.
    return <AuthSkeleton />
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[var(--background)] text-[var(--foreground)] overflow-hidden relative">
      <LoginShowcase />

      <div className="col-span-12 lg:col-span-5 flex flex-col items-center justify-center gap-8 px-5 py-12 sm:px-10 relative z-10 w-full min-h-screen lg:border-l lg:border-[var(--border-color)] bg-[var(--background)]">
        <div className="lg:hidden w-full max-w-[420px] relative h-56 sm:h-72 rounded-[28px] overflow-hidden border border-[var(--border-color)] bg-[var(--card)] shrink-0 flex items-center justify-center">
          <Image
            src="/images/logo/logotrsnprt.png"
            alt="A-store logo"
            width={896}
            height={1200}
            priority
            className="h-40 sm:h-52 w-auto object-contain dark:invert"
          />
        </div>

        <div className="w-full max-w-[450px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div
            className="rounded-[20px] p-[30px] flex flex-col gap-6 border border-[var(--border-color)] bg-[var(--card)] shadow-2xl"
          >
            {flow.signupSuccess ? (
              <SignupSuccess
                email={flow.email}
                onGoToSignIn={() => flow.switchMode("login")}
              />
            ) : (
              <AuthForm
                mode={flow.mode}
                email={flow.email}
                password={flow.password}
                username={flow.username}
                showPassword={flow.showPassword}
                isLoading={flow.isLoading}
                isGoogleLoading={flow.isGoogleLoading}
                feedback={flow.feedback}
                onEmailChange={flow.setEmail}
                onPasswordChange={flow.setPassword}
                onUsernameChange={flow.setUsername}
                onTogglePassword={() => flow.setShowPassword((v) => !v)}
                onSubmit={flow.handleSubmit}
                onGoogleLogin={flow.handleGoogleLogin}
                onForgotPassword={flow.handleForgotPassword}
                onDemoLogin={flow.handleDemoLogin}
                onSwitchMode={flow.switchMode}
              />
            )}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowRight size={12} className="rotate-180" aria-hidden />
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
