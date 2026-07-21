"use client"

import {
  Mail,
  Lock,
  ArrowRight,
  User,
  Eye,
  EyeOff,
  Loader2,
  Zap,
} from "lucide-react"
import type { AuthMode } from "@/components/login/types"
import { SocialAuth } from "@/components/login/social-auth"
import { AuthFeedbackBanner } from "@/components/login/auth-feedback"
import type { AuthFeedback } from "@/components/login/types"

type AuthFormProps = {
  mode: AuthMode
  email: string
  password: string
  username: string
  showPassword: boolean
  isLoading: boolean
  isGoogleLoading: boolean
  feedback: AuthFeedback | null
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onUsernameChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: (e: React.FormEvent) => void
  onGoogleLogin: () => void
  onDemoLogin: () => void
  onSwitchMode: (mode: AuthMode) => void
}

export function AuthForm({
  mode,
  email,
  password,
  username,
  showPassword,
  isLoading,
  isGoogleLoading,
  feedback,
  onEmailChange,
  onPasswordChange,
  onUsernameChange,
  onTogglePassword,
  onSubmit,
  onGoogleLogin,
  onDemoLogin,
  onSwitchMode,
}: AuthFormProps) {
  return (
    <>
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-xs font-medium text-[var(--muted-foreground)] tracking-wide uppercase">
          {mode === "login"
            ? "Sign in to your JUST SHOP account"
            : "Join JUST SHOP and start shopping"}
        </p>
      </div>

      {feedback && <AuthFeedbackBanner feedback={feedback} />}

      <SocialAuth onGoogleLogin={onGoogleLogin} isGoogleLoading={isGoogleLoading} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">
          or
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {mode === "signup" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Username
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Your display name"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder:text-neutral-500 transition-all font-medium"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Email Address
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder:text-neutral-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={mode === "signup" ? "Minimum 6 characters" : "••••••••"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder:text-neutral-500 transition-all font-medium"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {mode === "signup" && password.length > 0 && (
            <div className="flex gap-1.5 mt-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-all ${
                    password.length >= i * 4
                      ? password.length >= 10
                        ? "bg-emerald-500"
                        : password.length >= 6
                          ? "bg-yellow-500"
                          : "bg-rose-500"
                      : "bg-white/5"
                  }`}
                />
              ))}
              <span className="text-[9px] text-neutral-500 ml-1 font-mono">
                {password.length < 6 ? "TOO_WEAK" : password.length < 10 ? "GOOD" : "STRONG"}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-neutral-100 text-black rounded-xl text-xs font-black uppercase tracking-wider active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <>
              {mode === "login" ? "Sign in" : "Create account"}
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-white/5" />
        <span className="flex-shrink-0 mx-4 text-[9px] text-neutral-500 uppercase tracking-widest font-bold">
          Demo access
        </span>
        <div className="flex-grow border-t border-white/5" />
      </div>

      <button
        type="button"
        onClick={onDemoLogin}
        className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Zap size={13} />
        Try demo seller account
      </button>

      <p className="text-center text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
        {mode === "login" ? "New Operator? " : "Already Registered? "}
        <button
          type="button"
          onClick={() => onSwitchMode(mode === "login" ? "signup" : "login")}
          className="font-black text-white hover:underline underline-offset-2 transition-all cursor-pointer"
        >
          {mode === "login" ? "Create account" : "Sign in"}
        </button>
      </p>
    </>
  )
}
