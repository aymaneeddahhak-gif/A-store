import { Sparkles } from "lucide-react"

export function LoginShowcase() {
  return (
    <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 relative w-full h-full overflow-hidden bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover brightness-[0.45] contrast-[1.05]"
        src="/videos/waiting.mp4"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050505]/95 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-20 flex flex-col justify-between w-full h-full p-16 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-neutral-300 tracking-[0.2em] uppercase">
            Secure sign-in
          </span>
        </div>

        <div className="max-w-[600px] space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-neutral-300" />
            <span className="text-[9px] font-bold text-neutral-300 tracking-[0.2em] uppercase">
              JUST SHOP
            </span>
          </div>
          <h2 className="font-display text-4xl xl:text-6xl font-bold text-white leading-none tracking-tight">
            Shop smarter.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 via-neutral-400 to-neutral-500 font-normal">
              Manage orders with ease.
            </span>
          </h2>
          <p className="text-neutral-400 text-sm xl:text-base leading-relaxed">
            Sign in to track orders, save favorites, and access the seller dashboard.
          </p>
        </div>

        <p className="text-[10px] text-neutral-500 tracking-wide">
          Encrypted connection · Free returns · 24/7 support
        </p>
      </div>
    </div>
  )
}
