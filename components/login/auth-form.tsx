"use client"

import {
  Mail,
  Lock,
  User,
  CircleUserRound,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react"
import type { AuthMode } from "@/components/login/types"
import { SocialAuth } from "@/components/login/social-auth"
import { AuthFeedbackBanner } from "@/components/login/auth-feedback"
import type { AuthFeedback } from "@/components/login/types"
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
  "border-[1.5px] border-[#ecedec] dark:border-white/10 rounded-[10px] h-[50px] flex items-center pl-[10px] transition-all focus-within:border-[#2d79f3] bg-white dark:bg-white/5"
const inputCls =
  "ml-[10px] rounded-[10px] border-none w-full h-full bg-transparent text-sm text-[#151717] dark:text-[var(--foreground)] placeholder:text-neutral-400 focus:outline-none"
const labelCls = "text-[#151717] dark:text-neutral-200 font-semibold text-sm"

/**
 * The tester account is the public portfolio demo. The ADMIN one-click is
 * removed from the login UI everywhere — the admin signs in with its
 * credentials directly (kept out of the repo; see demo-accounts.ts).
 */
const visibleDemoAccounts = DEMO_ACCOUNTS.filter((a) => a.id !== "admin")

/**
 * Demo account hover card (TamaniPhiri pattern): user mascot + name, hover
 * reveals the sign-in pill. The whole card clicks so touch works too.
 */
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
      className="group relative rounded-xl overflow-hidden text-center p-4 flex flex-col items-center hover:shadow-2xl transition-all duration-500 shadow-xl bg-white dark:bg-white/5 border border-[#ededef] dark:border-white/10 w-full cursor-pointer disabled:opacity-50"
    >
      <div className="text-gray-500 dark:text-neutral-400 group-hover:scale-105 transition-all">
        <CircleUserRound className="w-16 h-16" strokeWidth={1.5} aria-hidden />
      </div>
      <div className="group-hover:pb-10 transition-all duration-500 delay-200">
        <p className="font-semibold text-gray-700 dark:text-[var(--foreground)] capitalize">
          {account.id}
        </p>
        <p className="text-gray-500 dark:text-[var(--muted-foreground)] text-xs truncate max-w-full">
          {account.email}
        </p>
      </div>
      <div className="transition-all duration-500 delay-200 group-hover:bottom-3 -bottom-full absolute flex justify-center w-full">
        <span className="bg-gray-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
          Sign in
        </span>
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
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)] tracking-tight">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-xs font-medium text-[var(--muted-foreground)] tracking-wide uppercase">
          {mode === "login"
            ? "Sign in to your A-store account"
            : "Join A-store and start shopping"}
        </p>
      </div>

      {feedback && <AuthFeedbackBanner feedback={feedback} />}

      <form className="flex flex-col gap-[10px]" onSubmit={onSubmit}>
        {mode === "signup" && (
          <div>
            <label className={labelCls}>Username</label>
            <div className={`${inputBoxCls} mt-1`}>
              <User size={20} className="text-neutral-400 shrink-0" aria-hidden />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Your display name"
                autoComplete="username"
                className={inputCls}
              />
            </div>
          </div>
        )}

        <div>
          <label className={labelCls}>Email</label>
          <div className={`${inputBoxCls} mt-1`}>
            <Mail size={20} className="text-neutral-400 shrink-0" aria-hidden />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Enter your Email"
              autoComplete="email"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Password</label>
          <div className={`${inputBoxCls} mt-1 pr-2`}>
            <Lock size={20} className="text-neutral-400 shrink-0" aria-hidden />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter your Password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputCls}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="p-1 text-neutral-400 hover:text-[#151717] dark:hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {mode === "signup" && password.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
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
              <span className="text-[9px] text-[var(--muted-foreground)] ml-1.5 font-bold uppercase tracking-wider">
                {password.length < 6 ? "Weak" : password.length < 10 ? "Good" : "Strong"}
              </span>
            </div>
          )}
        </div>

        {mode === "login" && (
          <div className="flex flex-row items-center justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-[#2d79f3] font-medium cursor-pointer hover:underline underline-offset-2"
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 mb-[10px] bg-[#151717] dark:bg-white border-none text-white dark:text-black text-[15px] font-medium rounded-[10px] h-[50px] w-full cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-black dark:text-neutral-300">
        {mode === "login" ? "Don't have an account? " : "Already registered? "}
        <button
          type="button"
          onClick={() => onSwitchMode(mode === "login" ? "signup" : "login")}
          className="text-sm ml-[5px] text-[#2d79f3] font-medium cursor-pointer hover:underline underline-offset-2"
        >
          {mode === "login" ? "Sign Up" : "Sign in"}
        </button>
      </p>

      <p className="text-center text-black dark:text-neutral-300 text-sm">Or With</p>

      <SocialAuth onGoogleLogin={onGoogleLogin} isGoogleLoading={isGoogleLoading} />

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-[var(--border-color)]" />
        <span className="flex-shrink-0 mx-4 text-[9px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">
          Portfolio demo — 1 click
        </span>
        <div className="flex-grow border-t border-[var(--border-color)]" />
      </div>

      <div className={visibleDemoAccounts.length > 1 ? "grid grid-cols-2 gap-2" : "grid grid-cols-1"}>
        {visibleDemoAccounts.map((account) => (
          <DemoAccountCard
            key={account.id}
            account={account}
            onSelect={onDemoLogin}
            disabled={isLoading}
          />
        ))}
      </div>
    </>
  )
}
