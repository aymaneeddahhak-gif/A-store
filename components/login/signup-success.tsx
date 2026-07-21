import { CheckCircle2 } from "lucide-react"

export function SignupSuccess({
  email,
  onGoToSignIn,
}: {
  email: string
  onGoToSignIn: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-1">Check your inbox!</h2>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          We sent a confirmation link to
          <br />
          <span className="font-semibold text-[var(--text-main)]">{email}</span>
        </p>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        After confirming, come back and sign in.
      </p>
      <button
        type="button"
        onClick={onGoToSignIn}
        className="mt-2 px-6 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-neutral-100 transition-all cursor-pointer"
      >
        Go to Sign In
      </button>
    </div>
  )
}
