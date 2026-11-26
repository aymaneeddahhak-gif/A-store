"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Toast, ToastAction, ToastDetail, ToastType } from "@/lib/types"
import {
  NotificationCard,
  OrderSuccessToast,
  STYLE_FOR_TYPE,
} from "@/components/notifications/notification-card"

type ToastContextType = {
  showToast: (message: string, type?: ToastType, actions?: ToastAction[], detail?: ToastDetail) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const VISIBLE_MS = 4500
/** Matches the exit keyframe duration in globals.css. */
const EXIT_MS = 220
/** Older toasts are dropped past this so a burst can't cover the viewport. */
const MAX_VISIBLE = 3

const VARIANTS: Record<
  ToastType,
  { accent: "emerald" | "rose" | "amber" | "slate"; ring: string }
> = {
  success: {
    accent: "emerald",
    ring: "var(--toast-success-soft)",
  },
  error: {
    accent: "rose",
    ring: "var(--toast-error-soft)",
  },
  warning: {
    accent: "amber",
    ring: "var(--toast-warning-soft)",
  },
  info: {
    accent: "slate",
    ring: "var(--toast-info-soft)",
  },
}

type ActiveToast = Toast & { leaving?: boolean }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([])
  // Every scheduled timer is tracked so nothing fires after unmount.
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>[]>())
  const pausedRef = useRef(false)

  const clearTimersFor = useCallback((id: string) => {
    timersRef.current.get(id)?.forEach(clearTimeout)
    timersRef.current.delete(id)
  }, [])

  useEffect(
    () => () => {
      timersRef.current.forEach((timers) => timers.forEach(clearTimeout))
      timersRef.current.clear()
    },
    []
  )

  /** Plays the exit animation, then removes the toast. */
  const dismiss = useCallback(
    (id: string) => {
      clearTimersFor(id)
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
      const exitTimer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
        timersRef.current.delete(id)
      }, EXIT_MS)
      timersRef.current.set(id, [exitTimer])
    },
    [clearTimersFor]
  )

  const scheduleDismiss = useCallback(
    (id: string, delay = VISIBLE_MS) => {
      clearTimersFor(id)
      timersRef.current.set(id, [setTimeout(() => dismiss(id), delay)])
    },
    [clearTimersFor, dismiss]
  )

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = "info",
      actions?: ToastAction[],
      detail?: ToastDetail
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      setToasts((prev) => {
        const next = [...prev, { id, message, type, actions, detail }]
        // Drop the oldest entries beyond the cap, cancelling their timers.
        const overflow = next.slice(0, Math.max(0, next.length - MAX_VISIBLE))
        overflow.forEach((t) => clearTimersFor(t.id))
        return next.slice(-MAX_VISIBLE)
      })
      if (!pausedRef.current) scheduleDismiss(id)
    },
    [clearTimersFor, scheduleDismiss]
  )

  /** Hovering or focusing the stack holds every toast so actions stay reachable. */
  const pauseAll = useCallback(() => {
    pausedRef.current = true
    timersRef.current.forEach((timers, id) => {
      // Don't freeze a toast that is already animating out.
      if (!toasts.find((t) => t.id === id)?.leaving) {
        timers.forEach(clearTimeout)
      }
    })
  }, [toasts])

  const resumeAll = useCallback(() => {
    pausedRef.current = false
    toasts.forEach((t) => {
      if (!t.leaving) scheduleDismiss(t.id, 1800)
    })
  }, [toasts, scheduleDismiss])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-24 left-1/2 z-[200] flex w-full max-w-[440px] -translate-x-1/2 flex-col gap-3 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
        onMouseEnter={pauseAll}
        onMouseLeave={resumeAll}
        onFocusCapture={pauseAll}
        onBlurCapture={resumeAll}
      >
        {toasts.map((toast) => {
          const variant = VARIANTS[toast.type] ?? VARIANTS.info
          const style = STYLE_FOR_TYPE[toast.type] ?? STYLE_FOR_TYPE.info
          const assertive = toast.type === "error" || toast.type === "warning"
          // Order confirmations wear the success wave card; everything else
          // keeps the standard notification card.
          const isOrderSuccess = toast.detail?.icon === "bag" || toast.detail?.wave === true
          const waveActions = toast.actions?.map((action) => ({
            label: action.label,
            onClick: () => {
              action.onClick()
              dismiss(toast.id)
            },
          }))
          return (
            <div
              key={toast.id}
              role={assertive ? "alert" : "status"}
              aria-live={assertive ? "assertive" : "polite"}
              className={`toast-item pointer-events-auto ${
                toast.leaving ? "toast-item--leaving" : ""
              }`}
              style={{ ["--toast-accent" as string]: variant.accent, ["--toast-ring" as string]: variant.ring }}
            >
              {isOrderSuccess ? (
                <OrderSuccessToast
                  title={toast.detail?.title ?? toast.message}
                  sub={toast.detail?.price ?? toast.message}
                  actions={waveActions}
                  onClose={() => dismiss(toast.id)}
                />
              ) : (
              <NotificationCard
                title={toast.detail?.title ?? toast.message}
                message={toast.detail?.title ? toast.message : undefined}
                productName={toast.detail?.productName}
                price={toast.detail?.price}
                icon={toast.detail?.icon ?? style.icon}
                accent={toast.detail?.accent ?? variant.accent}
                actions={toast.actions?.map((action) => ({
                  label: action.label,
                  onClick: () => {
                    action.onClick()
                    dismiss(toast.id)
                  },
                }))}
                onClose={() => dismiss(toast.id)}
              />
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
