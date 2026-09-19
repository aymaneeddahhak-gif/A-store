import Image from "next/image"

/** Login side panel — the brand mark centered on the card surface. */
export function LoginShowcase() {
  return (
    <div className="hidden lg:flex lg:col-span-7 relative min-h-screen items-center justify-center overflow-hidden bg-[var(--card)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--glass-bg)_0%,transparent_70%)]" aria-hidden />
      <Image
        src="/images/logo/logotrsnprt.png"
        alt="A-store logo"
        width={896}
        height={1200}
        priority
        className="relative h-[min(50vh,360px)] w-auto object-contain dark:invert"
      />
    </div>
  )
}
