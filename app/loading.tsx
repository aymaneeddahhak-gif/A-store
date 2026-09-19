import { StorefrontSkeleton } from "@/components/loading-skeletons"

/**
 * Route-level skeleton for the home catalog — hero, filter bar, and card
 * grid matching the real geometry so the swap causes minimal layout shift.
 */
export default function HomeLoading() {
  return <StorefrontSkeleton count={6} />
}
