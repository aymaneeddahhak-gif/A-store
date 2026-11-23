import { CartLoader } from "@/components/delivery-loader-overlay"

export default function ProfileLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/75 dark:bg-black/65 backdrop-blur-md shadow-[inset_0_0_120px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_0_120px_rgba(255,255,255,0.06)]"
    >
      <CartLoader message="Loading Profile" />
    </div>
  )
}
