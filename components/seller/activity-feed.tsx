import { Users } from "lucide-react"

export type ActivityItem = {
  user: string
  action: string
  item: string
  time: string
  initial: string
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] p-8">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <Users className="text-emerald-500" /> Store Pulse
      </h2>
      <div className="space-y-8">
        {activities.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No recent activity yet.</p>
        ) : (
          activities.map((act, i) => (
            <div key={`${act.user}-${act.time}-${i}`} className="flex gap-4 relative">
              {i !== activities.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-px bg-[var(--border-color)]" />
              )}
              <div className="w-10 h-10 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] shrink-0 flex items-center justify-center font-black text-xs">
                {act.initial}
              </div>
              <div className="space-y-1 pt-1">
                <p className="text-xs leading-relaxed text-[var(--foreground)]">
                  <span className="font-black">{act.user}</span> {act.action}{" "}
                  <span className="font-black text-emerald-500">{act.item}</span>
                </p>
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
                  {act.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function buildActivities(
  orders: { id: string; user_id: string; status: string; total: number; created_at: string }[]
): ActivityItem[] {
  return orders.slice(0, 5).map((order) => ({
    user: `User ${order.user_id.substring(0, 6)}`,
    action:
      order.status === "Pending"
        ? "placed an order"
        : `order status changed to ${order.status}`,
    item: `$${order.total.toFixed(2)}`,
    time: new Date(order.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    initial: order.user_id[0]?.toUpperCase() ?? "?",
  }))
}
