"use client"

import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import type { Toast, ToastType } from "@/lib/types"

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-24 left-1/2 z-[200] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4 pointer-events-none sm:left-auto sm:right-6 sm:translate-x-0 sm:bottom-6"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300
              ${toast.type === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-100" : ""}
              ${toast.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : ""}
              ${toast.type === "info" ? "border-[var(--border-color)] bg-[var(--card)] text-[var(--foreground)]" : ""}
            `}
          >
            {toast.type === "success" && <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />}
            {toast.type === "error" && <AlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />}
            {toast.type === "info" && <Info size={18} className="shrink-0 text-[var(--muted-foreground)] mt-0.5" />}
            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
