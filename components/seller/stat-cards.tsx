import { DollarSign, Users, Package } from "lucide-react"

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export type StatItem = {
  label: string
  value: string
  icon: React.ReactNode
}

export function StatCards({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="p-6 bg-[var(--card)] border border-[var(--border-color)] rounded-[32px] hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-12 h-12 bg-[var(--background)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--border-color)] transition-transform group-hover:scale-110">
            {stat.icon}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-40">{stat.label}</p>
          <p className="text-3xl font-black text-[var(--foreground)] mt-1">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

export function buildSellerStats(
  orders: { status: string; total: number; user_id: string }[],
  productCount: number
): StatItem[] {
  const revenue = orders.reduce(
    (sum, o) => (o.status !== "Cancelled" ? sum + o.total : sum),
    0
  )
  const pending = orders.filter((o) => o.status === "Pending").length
  const customers = new Set(orders.map((o) => o.user_id)).size

  return [
    {
      label: "Total Revenue",
      value: `$${revenue.toFixed(2)}`,
      icon: <DollarSign className="text-emerald-500" />,
    },
    {
      label: "Pending Orders",
      value: pending.toString(),
      icon: <ClockIcon className="text-amber-500" />,
    },
    {
      label: "Total Customers",
      value: customers.toString(),
      icon: <Users className="text-blue-500" />,
    },
    {
      label: "Inventory Items",
      value: productCount.toString(),
      icon: <Package className="text-purple-500" />,
    },
  ]
}
