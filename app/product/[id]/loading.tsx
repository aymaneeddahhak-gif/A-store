import { CartLoader } from "@/components/delivery-loader-overlay"

export default function ProductLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#faf7f2]/90 dark:bg-[#0b0d11]/90"
    >
      <CartLoader message="Loading Product" />
    </div>
  )
}
