# A-Store — Modern Full-Stack E-Commerce Platform

A production-grade, full-stack e-commerce experience built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS 4**, and **Supabase (Auth, PostgreSQL, Realtime & Storage)**. Designed with a dark glassmorphic UI, real-time catalog syncing, robust server-side trust boundaries, and seller management tools.

---

## Highlights

- **Server-Driven Commerce**: Prices, promotional discounts, and shipping are strictly calculated on the server via Server Actions. The client decides *what* to buy; the server decides *what it costs*.
- **Live Catalog & Seller Dashboard**: Product CRUD, inventory tracking, live showcase pinning, and order fulfillment state machine (`Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered`).
- **PostgreSQL Realtime Synchronization**: Live updates streamed via Postgres CDC publication (`supabase_realtime`) to update products and store settings without page reloads.
- **Strict Row-Level Security (RLS)**: Buyers are sandboxed to their own orders, direct client manipulation of order totals/statuses is blocked, and catalog mutations are enforced through authenticated server sessions.
- **Glassmorphic UI & UX Polish**: Theme engine (dark/light) with anti-flash script, accessible skip navigation, reduced-motion compatibility, and responsive mobile drawers.
- **One-Click Demo Sign-in**: Instant Seller and Client roles for evaluating the storefront, checkout, and seller dashboard without manual account registration.

---

## 🏗️ Architecture & Security Model

```
Browser Client                    Next.js App Router (Server)           Supabase (PostgreSQL)
┌────────────────┐               ┌───────────────────────────┐         ┌───────────────────────┐
│                │  Cart Items   │  • Recomputes true price  │  Atomic │                       │
│  User Checkout ├──────────────►│  • Validates live stock   ├────────►│  orders (RLS sandbox) │
│                │               │  • Deducts inventory      │  Insert │  products             │
└────────────────┘               │  • Signs audit log        │         │  audit_log            │
                                 └───────────────────────────┘         └───────────────────────┘
```

### Trust Boundaries & Data Integrity
1. **Order Security**: Direct `INSERT` and `UPDATE` on the `orders` table via the client anon key are restricted by RLS. Order placement occurs through server actions (`placeOrderAction`) that recalculate totals against active database prices and apply transactional stock adjustments.
2. **Catalog Mutability**: Store-wide catalog items carry `user_id = NULL` and can only be altered by authenticated store administrators using server-side service role execution.
3. **Audit Logging**: Sensitive mutations (product creation/deletion, order status transitions, setting updates) are recorded to an append-only `audit_log` table.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/a-store.git
cd a-store
npm install
```

### 2. Configure Environment Variables
Copy the template file to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SELLER_EMAILS=seller@a-store.shop
```

### 3. Initialize Database & Seed Data
In your [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**:
1. Run [`sql/schema.sql`](sql/schema.sql) to create all tables, indexes, constraints, and RLS policies.
2. Run [`sql/seed.sql`](sql/seed.sql) to populate initial products, promo codes (`WELCOME10`, `SAVE20`), and store settings.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Roles & Access

Visit `/login` to try the platform with one-click isolated visitor sessions, or register with your own Email / Google account for permanent Supabase history:

| Role | Access | Capabilities |
|------|--------|--------------|
| **Client** | One-click at `/login` (per-visitor isolated session) or Email / Google Sign-Up | Browse live products, save favourites, post reviews, apply promo codes, place orders, and track order history in `/profile`. |
| **Seller** | One-click at `/login` (per-visitor isolated Supabase sandbox) | Create, edit, restock, and delete their own products, apply/clear offers on their own products, and manage order fulfillment in `/seller`. Edits stay isolated from the main storefront. |
| **Admin** | Private (developer only — no public credentials) | Only the developer/store owner has access to manage the original store product catalog, homepage featured showcase, global offers, store settings, and audit logs. |

---

## 🛠️ Scripts & Quality Checks

- `npm run dev` — Starts the Next.js development server
- `npm run build` — Compiles production bundle with strict TypeScript checking
- `npm run typecheck` — Runs `tsc --noEmit` across all components and server actions
- `npm run lint` — Runs ESLint with Next.js Core Web Vitals configuration
- `npm run test` — Executes Playwright end-to-end smoke tests
- `npm run format` — Formats files using Prettier and Tailwind plugin

---

## 📁 Project Structure

```
├── app/                  # Next.js App Router (pages, layouts, error boundaries)
│   ├── auth/callback/    # Supabase OAuth PKCE exchange handler
│   ├── checkout/         # Multi-step checkout experience
│   ├── orders/           # Buyer order history and live shipment tracking
│   ├── product/[id]/     # Dynamic product detail page with reviews & variants
│   ├── profile/          # User profile and order timeline
│   ├── seller/           # Seller dashboard (products, orders, analytics)
│   ├── error.tsx         # Global route error boundary
│   └── not-found.tsx     # Custom 404 handler
├── components/           # Reusable UI components
│   ├── checkout/         # Shipping & review modules
│   ├── product/          # Product gallery, review form, buy box
│   ├── profile/          # Profile tabs, order tracker dashboard
│   ├── seller/           # New seller console views & metrics
│   └── storefront/       # Hero showcase, filter drawer, product cards
├── contexts/             # State providers (Cart, Catalog, Auth, Notifications)
├── lib/                  # Server actions, queries, types, and database clients
│   ├── actions/          # Server mutations (orders, products, promos, media)
│   ├── queries/          # Server-only read queries with timeout guards
│   ├── supabase.ts       # Browser Supabase client
│   ├── supabase-server.ts# Cookie-bound SSR client
│   └── supabase-admin.ts # Service-role client (server-only)
├── sql/                  # Complete SQL schema, seed, and RLS configurations
└── tests/                # Playwright E2E smoke tests
```

---

## 📄 License

MIT © [A-Store](https://a-store.shop)
