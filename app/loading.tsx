import { CartLoader } from "@/components/delivery-loader-overlay"

export default function HomeLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-white/80 dark:bg-black/70 backdrop-blur-md shadow-[inset_0_0_120px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_0_120px_rgba(255,255,255,0.06)]"
    >
      <CartLoader message="Loading" />
    </div>
  )
}
