"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { LoginShowcase } from "@/components/login/login-showcase"
import { SignupSuccess } from "@/components/login/signup-success"
import { AuthForm } from "@/components/login/auth-form"
import { useAuthFlow } from "@/hooks/use-auth-flow"

export function LoginPageClient() {
  const flow = useAuthFlow()

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-140px)] -mt-2 lg:-mt-6 px-4">
      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12">
        {/* Left: Animated transparent WebM lion mascot aligned flush with top of login card */}
        <div className="hidden lg:flex flex-1 items-start justify-center max-w-[480px] self-start">
          <LoginShowcase />
        </div>

        {/* Right: Uiverse-styled Login Form Card */}
        <div className="uiverse-login-card relative z-10">
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

          <div className="text-center pt-1">
            <Link
              href="/"
              className="text-[11px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowRight size={11} className="rotate-180" aria-hidden />
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
