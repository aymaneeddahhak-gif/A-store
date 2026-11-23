import type { Order, Product } from "@/lib/types"
import type { ProductItem } from "./types"

export function stockStatus(stock: number): ProductItem["status"] {
  if (stock <= 0) return "Out of Stock"
  if (stock < 20) return "Low Stock"
  return "In Stock"
}

export function parsePrice(price: string): number {
  const n = parseFloat(String(price).replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

export function parseDiscount(discount: string): number {
  const n = parseFloat(String(discount).replace(/[^0-9.]/g, ""))
  if (!Number.isFinite(n)) return 0
  return Math.min(90, Math.max(0, n))
}

/** Real Supabase row -> new-design card. No mock fields survive except gender/sku fallbacks (no columns exist). */
export function toProductItem(p: Product): ProductItem {
  const stock = p.stock ?? 0
  const discountPct =
    p.original_price && p.original_price > p.price
      ? Math.round((1 - p.price / p.original_price) * 100)
      : 0
  const images = [p.image, ...(p.images ?? [])].filter(Boolean)
  return {
    id: String(p.id),
    name: p.name,
    description: p.description ?? "",
    price: `$${p.price.toFixed(2)}`,
    stock: String(stock),
    discount: `${discountPct}%`,
    discountType: "Member Exclusive",
    category: p.category,
    gender: "Unisex",
    sizes: p.custom_sizes?.length ? p.custom_sizes : ["M"],
    colors: (p.custom_colors ?? []).map((c) => c.name),
    sku: `SKU-${p.id}`,
    productType: p.category,
    images: images.length ? images : [p.image],
    video: p.video,
    featured: !!p.featured,
    sales: p.sold_count ?? 0,
    status: stockStatus(stock),
  }
}

/** New-design form -> real product payload. Colors need hex lookup from the form's palette. */
export function toProductPayload(form: {
  name: string
  basePrice: string
  stock: string
  discount: string
  category: string
  description: string
  images: string[]
  selectedSizes: string[]
  selectedColors: string[]
  availableColors: { name: string; hex: string }[]
}): Omit<Product, "id" | "likes" | "rating" | "reviews"> {
  const price = parsePrice(form.basePrice)
  const discountPct = parseDiscount(form.discount)
  const original_price =
    discountPct > 0 ? price / (1 - discountPct / 100) : null
  const stock = Math.max(0, Math.floor(Number(form.stock) || 0))
  const [image, ...rest] = form.images.filter(Boolean)
  return {
    name: form.name.trim(),
    price,
    original_price,
    category: form.category,
    description: form.description,
    image: image ?? "",
    images: [...new Set(rest)].slice(0, 6),
    stock,
    is_published: true,
    custom_colors: form.selectedColors.map((name) => ({
      name,
      hex: form.availableColors.find((c) => c.name === name)?.hex ?? "#888888",
    })),
    custom_sizes: form.selectedSizes,
  }
}

export interface OverviewStats {
  revenue: number
  orders: number
  products: number
  customers: number
}

export function buildOverviewStats(orders: Order[], productCount: number): OverviewStats {
  return {
    revenue: orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    orders: orders.length,
    products: productCount,
    customers: new Set(orders.map((o) => o.user_id)).size,
  }
}

/** Latest order date (or today when empty) — charts anchor here so month
 *  filters and quiet stores still render meaningful windows. */
export function anchorDate(orders: Order[]): Date {
  let max = 0
  for (const o of orders) {
    const t = new Date(o.created_at).getTime()
    if (Number.isFinite(t) && t > max) max = t
  }
  return max ? new Date(max) : new Date()
}

/** Last N calendar months ending at the anchor — feeds the month filter. */
export function lastMonths(orders: Order[], count = 6): { key: string; label: string }[] {
  const a = anchorDate(orders)
  const out: { key: string; label: string }[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(a.getFullYear(), a.getMonth() - i, 1)
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    })
  }
  return out
}

/** Last-7-days revenue bars for the overview chart. Empty DB -> zeros, never mock. */
export function buildWeeklyRevenue(orders: Order[]): { label: string; revenue: number; orders: number }[] {
  const days: { label: string; revenue: number; orders: number }[] = []
  const now = anchorDate(orders)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const dayOrders = orders.filter((o) => String(o.created_at).slice(0, 10) === key)
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      orders: dayOrders.length,
    })
  }
  return days
}

export function topSelling(products: Product[], limit = 5): Product[] {
  return [...products].sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0)).slice(0, limit)
}

export interface OverviewProps {
  kpis: { id: string; title: string; value: string; change: string; isPositive: boolean; period: string }[]
  weeklyData: { label: string; revenue: number; height: number; orders: number }[]
  monthlyData: { label: string; revenue: number; height: number; orders: number }[]
  topProducts: { id: string; name: string; pieces: string; image: string }[]
  recentOrders: { id: string; customer: string; product: string; amount: string; status: string }[]
  categoryShare: { name: string; share: number; amount: string }[]
  categoryTotal: string
  avgRevenueLabel: string
  growthLabel: string
}

function money(n: number, digits = 0): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

/** Category revenue from live order items (snapshots carry category/price/qty). */
export function categoryRevenue(orders: Order[]): { name: string; revenue: number }[] {
  const map = new Map<string, number>()
  for (const o of orders) {
    for (const item of o.items ?? []) {
      const cat = (item as { category?: string }).category ?? "Other"
      map.set(cat, (map.get(cat) ?? 0) + Number(item.price || 0) * Number(item.quantity || 1))
    }
  }
  return [...map.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
}

/** Full overview prop set — same shapes the design renders, zero mock numbers. */
export function buildOverviewProps(orders: Order[], products: Product[]): OverviewProps {
  const stats = buildOverviewStats(orders, products.length)
  const weeklyRaw = buildWeeklyRevenue(orders)
  const wMax = Math.max(1, ...weeklyRaw.map((d) => d.revenue))
  const weeklyData = weeklyRaw.map((d) => ({ ...d, height: Math.max(3, Math.round((d.revenue / wMax) * 100)) }))

  // Last 6 calendar months ending at the anchor.
  const months: { key: string; label: string; revenue: number; orders: number }[] = []
  const now = anchorDate(orders)
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      revenue: 0,
      orders: 0,
    })
  }
  for (const o of orders) {
    const m = months.find((m) => String(o.created_at).slice(0, 7) === m.key)
    if (m) {
      m.revenue += Number(o.total) || 0
      m.orders += 1
    }
  }
  const mMax = Math.max(1, ...months.map((m) => m.revenue))
  const monthlyData = months.map((m) => ({
    label: m.label,
    revenue: m.revenue,
    orders: m.orders,
    height: Math.max(3, Math.round((m.revenue / mMax) * 100)),
  }))

  const topProducts = topSelling(products, 5).map((p) => ({
    id: String(p.id),
    name: p.name,
    pieces: `${p.stock ?? 0} Pcs`,
    image: p.image,
  }))

  const recentOrders = [...orders]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 4)
    .map((o) => ({
      id: o.id,
      customer: `Customer …${o.user_id.slice(-6)}`,
      product: o.items?.[0] ? `${o.items[0].name}${o.items.length > 1 ? ` (+${o.items.length - 1})` : ""}` : "—",
      amount: money(Number(o.total) || 0, 2),
      status: o.status,
    }))

  const cats = categoryRevenue(orders)
  const catTotal = cats.reduce((s, c) => s + c.revenue, 0)
  const categoryShare =
    cats.length > 0
      ? cats.slice(0, 4).map((c) => ({
          name: c.name,
          share: catTotal > 0 ? Math.round((c.revenue / catTotal) * 100) : 0,
          amount: money(c.revenue),
        }))
      : (() => {
          const byCat = new Map<string, number>()
          for (const p of products) byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1)
          const total = Math.max(1, products.length)
          return [...byCat.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name, n]) => ({ name, share: Math.round((n / total) * 100), amount: `${n} items` }))
        })()

  const last7 = weeklyRaw.reduce((s, d) => s + d.revenue, 0)
  const avgRevenueLabel = `Average revenue: ${money(last7 / 7)}/day`
  const anchorEnd = anchorDate(orders).getTime()
  const day = 86400000
  const prev7 = orders
    .filter((o) => {
      const t = new Date(o.created_at).getTime()
      return t < anchorEnd - 7 * day && t >= anchorEnd - 14 * day
    })
    .reduce((s, o) => s + (Number(o.total) || 0), 0)
  const growthLabel =
    prev7 > 0
      ? `${((last7 - prev7) / prev7 >= 0 ? "+" : "")}${(((last7 - prev7) / prev7) * 100).toFixed(1)}% growth vs last period`
      : "Live from your orders table"

  return {
    kpis: [
      { id: "kpi-revenue", title: "Total Revenue", value: money(stats.revenue), change: `${stats.orders} orders`, isPositive: true, period: "all time live" },
      { id: "kpi-orders", title: "Total Orders", value: String(stats.orders), change: `${stats.customers} buyers`, isPositive: true, period: "all time live" },
      { id: "kpi-products", title: "Active Products", value: String(stats.products), change: `${products.filter((p) => (p.stock ?? 0) < 20).length} low`, isPositive: true, period: "in your catalog" },
      { id: "kpi-customers", title: "Active Customers", value: String(stats.customers), change: money(stats.orders > 0 ? stats.revenue / stats.orders : 0, 2), isPositive: true, period: "avg per order" },
    ],
    weeklyData,
    monthlyData,
    topProducts,
    recentOrders,
    categoryShare,
    categoryTotal: money(catTotal > 0 ? catTotal : stats.revenue),
    avgRevenueLabel,
    growthLabel,
  }
}

export interface AnalyticsProps {
  metrics: { title: string; val: string; change: string; note: string }[]
  channels: { name: string; visitors: string; sales: string; pct: number }[]
}

export function buildAnalyticsProps(orders: Order[], products: Product[]): AnalyticsProps {
  const stats = buildOverviewStats(orders, products.length)
  const aov = stats.orders > 0 ? stats.revenue / stats.orders : 0
  const perCustomer = new Map<string, number>()
  for (const o of orders) perCustomer.set(o.user_id, (perCustomer.get(o.user_id) ?? 0) + 1)
  const repeat = perCustomer.size > 0 ? [...perCustomer.values()].filter((n) => n > 1).length / perCustomer.size : 0
  const cats = categoryRevenue(orders)
  const total = Math.max(1, cats.reduce((s, c) => s + c.revenue, 0))
  return {
    metrics: [
      { title: "Total Revenue", val: money(stats.revenue), change: `${stats.orders} orders`, note: "all time live" },
      { title: "Average Order Value", val: money(aov, 2), change: `${stats.customers} buyers`, note: "per order" },
      { title: "Repeat Customers", val: `${(repeat * 100).toFixed(1)}%`, change: `${perCustomer.size} total`, note: "ordered more than once" },
      { title: "Active Products", val: String(stats.products), change: `${products.filter((p) => (p.stock ?? 0) === 0).length} out`, note: "out of stock" },
    ],
    channels: cats.slice(0, 4).map((c) => ({
      name: c.name,
      visitors: `${cats.length} cats`,
      sales: money(c.revenue),
      pct: Math.round((c.revenue / total) * 100),
    })),
  }
}

export interface CustomerRow {
  userId: string
  name: string
  email: string
  orders: number
  total: string
  tier: string
  lastOrder: string
}

export function buildCustomerRows(orders: Order[]): CustomerRow[] {
  const map = new Map<string, { orders: number; total: number; last: string }>()
  for (const o of orders) {
    const cur = map.get(o.user_id) ?? { orders: 0, total: 0, last: "" }
    cur.orders += 1
    cur.total += Number(o.total) || 0
    if (String(o.created_at) > cur.last) cur.last = String(o.created_at)
    map.set(o.user_id, cur)
  }
  return [...map.entries()]
    .map(([uid, v]) => ({
      userId: uid,
      name: `Customer …${uid.slice(-6)}`,
      // Real identity is the admin-only profile lookup's job. This column
      // stays a stable masked handle — it used to hold a summary string
      // ("2 orders · last 3/12") that collided as a React key.
      email: `Buyer account …${uid.slice(-6)}`,
      orders: v.orders,
      total: money(v.total, 2),
      tier: v.total >= 1000 ? "Platinum VIP" : v.total >= 500 ? "Gold Member" : v.total >= 150 ? "Silver Member" : "Standard",
      lastOrder: v.last ? new Date(v.last).toLocaleDateString() : "",
    }))
    .sort((a, b) => b.orders - a.orders)
}
