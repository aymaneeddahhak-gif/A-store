import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { AuthFeedback } from "@/components/login/types"

export function AuthFeedbackBanner({ feedback }: { feedback: AuthFeedback }) {
  return (
    <div
      className={`p-3.5 rounded-xl flex flex-col gap-1.5 text-xs border font-medium tracking-wide uppercase
        ${feedback.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : ""}
        ${feedback.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ""}
        ${feedback.type === "info" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : ""}
      `}
    >
      <div className="flex items-start gap-2">
        {feedback.type === "error" && <AlertCircle size={14} className="mt-0.5 shrink-0" />}
        {feedback.type === "success" && <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
        {feedback.type === "info" && <AlertCircle size={14} className="mt-0.5 shrink-0" />}
        <p className="leading-snug normal-case">{feedback.message}</p>
      </div>
      {feedback.action && (
        <button
          type="button"
          onClick={feedback.action.onClick}
          className="text-left underline underline-offset-2 text-[10px] font-bold hover:no-underline transition-all pl-5 cursor-pointer normal-case"
        >
          {feedback.action.label} →
        </button>
      )}
    </div>
  )
}
