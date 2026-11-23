"use client"

import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react"
import type { AuthMode, AuthFeedback } from "@/components/login/types"
import { SocialAuth } from "@/components/login/social-auth"
import { AuthFeedbackBanner } from "@/components/login/auth-feedback"
import { VectorAvatar } from "@/components/avatars/role-avatar"
import { DEMO_ACCOUNTS, type DemoAccount, type DemoAccountId } from "@/lib/demo-accounts"

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
  onForgotPassword: () => void
  onDemoLogin: (accountId: DemoAccountId) => void
  onSwitchMode: (mode: AuthMode) => void
}

const inputBoxCls =
  "border-[1.5px] border-[#ecedec] dark:border-white/10 rounded-xl h-[40px] flex items-center pl-[12px] transition-all focus-within:border-[#2d79f3] bg-white dark:bg-white/5"
const inputCls =
  "ml-[8px] rounded-xl border-none w-full h-full bg-transparent text-xs sm:text-sm text-[#151717] dark:text-[var(--foreground)] placeholder:text-neutral-400 focus:outline-none"
const labelCls = "text-[#151717] dark:text-neutral-200 font-semibold text-[11px] uppercase tracking-wider"

function DemoAccountCard({
  account,
  onSelect,
  disabled,
}: {
  account: DemoAccount
  onSelect: (id: DemoAccountId) => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(account.id)}
      disabled={disabled}
      className="group relative rounded-xl text-left p-2.5 flex flex-col justify-between gap-1.5 transition-all duration-200 bg-white dark:bg-white/5 hover:bg-sky-50/60 dark:hover:bg-white/10 border border-[#e5e7eb] dark:border-white/10 hover:border-[#2d79f3]/50 shadow-sm hover:shadow w-full cursor-pointer disabled:opacity-50"
    >
      <div className="flex items-center justify-between w-full">
        <VectorAvatar variant={account.id} sizeClass="w-8 h-8" />
        <span className="text-[10px] font-bold text-[#2d79f3]">
          One-Click
        </span>
      </div>

      <div>
        <p className="font-bold text-xs text-gray-900 dark:text-[var(--foreground)] leading-tight">
          {account.label}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
          {account.description}
        </p>
      </div>
    </button>
  )
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
  onForgotPassword,
  onDemoLogin,
  onSwitchMode,
}: AuthFormProps) {
  return (
    <>
      <div className="space-y-0.5">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-xs font-medium text-[var(--muted-foreground)]">
          {mode === "login"
            ? "Sign in with a One-Click demo role or your A-store credentials"
            : "Join A-store to track orders and manage your wishlist"}
        </p>
      </div>

      {/* Instant One-Click Portfolio Demo Access at the top for recruiters & clients */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">
            Instant One-Click Portfolio Demo Access
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            No password needed
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <DemoAccountCard
              key={account.id}
              account={account}
              onSelect={onDemoLogin}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      <div className="relative flex items-center py-0.5">
        <div className="flex-grow border-t border-[var(--border-color)]" />
        <span className="flex-shrink-0 mx-2 text-[9px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">
          Or sign in with email
        </span>
        <div className="flex-grow border-t border-[var(--border-color)]" />
      </div>

      {feedback && <AuthFeedbackBanner feedback={feedback} />}

      <form className="flex flex-col gap-2.5" onSubmit={onSubmit}>
        {mode === "signup" && (
          <div>
            <label className={labelCls}>Full Name</label>
            <div className={`${inputBoxCls} mt-1`}>
              <User size={16} className="text-neutral-400 shrink-0" aria-hidden />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Your display name"
                autoComplete="name"
                className={inputCls}
              />
            </div>
          </div>
        )}

        <div>
          <label className={labelCls}>Email</label>
          <div className={`${inputBoxCls} mt-1`}>
            <Mail size={16} className="text-neutral-400 shrink-0" aria-hidden />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelCls}>Password</label>
            {mode === "login" && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[11px] text-[#2d79f3] font-medium cursor-pointer hover:underline underline-offset-2"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className={`${inputBoxCls} mt-1 pr-2`}>
            <Lock size={16} className="text-neutral-400 shrink-0" aria-hidden />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter your password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputCls}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="p-1 text-neutral-400 hover:text-[#151717] dark:hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {mode === "signup" && password.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-all ${
                    password.length >= i * 4
                      ? password.length >= 10
                        ? "bg-[var(--toast-success)]"
                        : password.length >= 6
                          ? "bg-[var(--toast-warning)]"
                          : "bg-[var(--toast-error)]"
                      : "bg-[var(--border-color)]"
                  }`}
                />
              ))}
              <span className="text-[9px] text-[var(--muted-foreground)] ml-1 font-bold uppercase tracking-wider">
                {password.length < 6 ? "Weak" : password.length < 10 ? "Good" : "Strong"}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 bg-[#151717] dark:bg-white border-none text-white dark:text-black text-xs font-semibold rounded-xl h-[40px] w-full cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <SocialAuth onGoogleLogin={onGoogleLogin} isGoogleLoading={isGoogleLoading} />

      <p className="text-center text-xs text-black dark:text-neutral-300">
        {mode === "login" ? "Don't have an account? " : "Already registered? "}
        <button
          type="button"
          onClick={() => onSwitchMode(mode === "login" ? "signup" : "login")}
          className="text-xs ml-1 text-[#2d79f3] font-semibold cursor-pointer hover:underline underline-offset-2"
        >
          {mode === "login" ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </>
  )
}
