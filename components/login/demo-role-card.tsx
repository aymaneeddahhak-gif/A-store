/*
 * From Uiverse.io by Uncannypotato69 - https://uiverse.io/Uncannypotato69/angry-rattlesnake-53
 * MIT License, Copyright (c) Uncannypotato69
 */
"use client"

import { ArrowRight } from "lucide-react"
import { VectorAvatar } from "@/components/avatars/role-avatar"
import type { DemoAccount, DemoAccountId } from "@/lib/demo-accounts"

const CIRCLE_BG_BY_ROLE: Record<DemoAccountId, string> = {
  demo_seller: "bg-[#16a34a]",
  customer: "bg-[#FF5800]",
  demo_admin: "bg-[#2563eb]",
}

export function DemoRoleCard({
  account,
  onSelect,
  disabled,
  compact = false,
}: {
  account: DemoAccount
  onSelect: (id: DemoAccountId) => void
  disabled: boolean
  compact?: boolean
}) {
  const circleBg = CIRCLE_BG_BY_ROLE[account.id] ?? "bg-[#FF5800]"

  return (
    <button
      type="button"
      onClick={() => onSelect(account.id)}
      disabled={disabled}
      className={`${
        compact ? "h-[4.4em] px-3.5 py-2.5 flex items-center justify-between" : "h-[7.2em] p-3"
      } w-full bg-white dark:bg-[#1c1f26] border border-[#ededef] dark:border-white/10 rounded-[1em] overflow-hidden relative group z-0 text-left cursor-pointer transition-shadow hover:shadow-md disabled:opacity-55 disabled:cursor-not-allowed`}
    >
      {/* Signature Uiverse expanding corner circle */}
      <span
        aria-hidden
        className={`absolute h-[5em] w-[5em] -top-[2.5em] -right-[2.5em] rounded-full ${circleBg} group-hover:scale-[900%] transition-transform duration-500 z-[-1]`}
      />

      {/* Profile Head + Heading */}
      <div className="relative z-20 flex items-center gap-2.5">
        <div className="shrink-0 rounded-full ring-2 ring-white/90 dark:ring-white/20 shadow-xs">
          <VectorAvatar variant={account.id} sizeClass="w-8 h-8" />
        </div>
        <span className="font-bold text-[#151717] dark:text-white group-hover:text-white transition-colors duration-500 text-[1.02em] leading-tight">
          {account.label}
        </span>
      </div>

      {/* Action Indicator with Uiverse Underline */}
      <span
        className={`text-[0.8em] font-semibold text-[#6C3082] dark:text-[#c084fc] group-hover:text-white transition-colors duration-500 inline-flex items-center gap-1.5 z-20 ${
          compact ? "relative mr-7" : "absolute bottom-[0.9em] left-[0.95em]"
        }`}
      >
        <span className="relative before:h-[0.16em] before:absolute before:w-full before:content-[''] before:bg-[#6C3082] dark:before:bg-[#c084fc] group-hover:before:bg-white before:transition-colors before:duration-300 before:bottom-0 before:left-0 pb-0.5">
          Demo Login
        </span>
        <ArrowRight size={13} aria-hidden />
      </span>
    </button>
  )
}
