"use client"

import dynamic from "next/dynamic"
import { useAuth } from "@/contexts/providers/auth-context"
import { isSellerEmail } from "@/lib/seller"
import { SellerRestrictedGate } from "@/components/seller/restricted-gate"
import { DashboardSkeleton } from "@/components/loading-skeletons"

const NewSellerDashboard = dynamic(
  () => import("@/components/seller/new-seller-dashboard").then((m) => m.NewSellerDashboard),
  { ssr: false, loading: () => <DashboardSkeleton /> }
)

/**
 * Lightweight `/seller` entry shell: renders the preview gate immediately for
 * guests and non-seller customers without loading the full dashboard bundle,
 * and lazy-loads `NewSellerDashboard` only when a seller or admin is signed in.
 */
export function SellerPageShell() {
  const { user, authLoading } = useAuth()
  const canManageOrders = isSellerEmail(user?.email)

  if (!authLoading && (!user || !canManageOrders)) {
    return <SellerRestrictedGate isSignedInNonSeller={Boolean(user && !canManageOrders)} />
  }
  if (!user) return <DashboardSkeleton />

  return <NewSellerDashboard />
}
