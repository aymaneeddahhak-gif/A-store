"use client"

import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { VideoLogo } from "@/components/video-logo"
import { LoginShowcase } from "@/components/login/login-showcase"
import { SignupSuccess } from "@/components/login/signup-success"
import { AuthForm } from "@/components/login/auth-form"
import { useAuthFlow } from "@/hooks/use-auth-flow"

export function LoginPageClient() {
  const flow = useAuthFlow()

  if (flow.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  if (flow.user) return null

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#050505] text-[var(--foreground)] overflow-hidden relative">
      <LoginShowcase />

      <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex items-center justify-center p-4 sm:p-10 relative z-10 w-full min-h-screen lg:border-l lg:border-white/5 bg-[#050505]">
        <div className="lg:hidden absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover brightness-[0.22] contrast-[1.05]"
            src="/videos/waiting.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-[#050505] pointer-events-none" />
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          <div className="flex flex-col items-center mb-8">
            <VideoLogo size="lg" />
          </div>

          <div
            className="floating-nav !rounded-3xl p-8 flex flex-col gap-6 border border-white/5 bg-black/60 backdrop-blur-xl"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
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
                onDemoLogin={flow.handleDemoLogin}
                onSwitchMode={flow.switchMode}
              />
            )}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowRight size={12} className="rotate-180" />
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
