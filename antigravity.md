# FIKRA.LABS — Project Bible

> **Purpose of this file:** This is the single source of truth for any developer, AI agent, or recruiter reviewing this codebase. Read this FIRST before touching any file. It documents the architecture, strategy, conventions, known issues, and every design decision made in this project.

---

## 1. What Is This Project?

**FIKRA.LABS** is a full-stack, production-grade e-commerce platform built as a **portfolio / CV showcase**. It is designed to demonstrate mastery of modern frontend engineering, full-stack database integration, real-time UI patterns, and premium visual design — all in one cohesive application.

**This is NOT a template.** Every component, animation, and interaction was hand-crafted to showcase professional-level skills to recruiters and hiring managers.

### Core Value Proposition (Portfolio Angle)
| Skill Demonstrated | Where To See It |
|---|---|
| Full-Stack Architecture | Supabase PostgreSQL + Auth + RLS |
| React State Management | Single `ShopContext` powering the entire app |
| Premium UI/UX Design | Glassmorphism, SVG turbulence effects, micro-animations |
| 3D Web Graphics | Three.js / React Three Fiber hero section |
| AI-Powered Features | Inventory-aware chatbot with voice I/O |
| Authentication | Google OAuth + Email/Password via Supabase |
| Real-Time Dashboard | Seller panel with live order tracking |
| Responsive Design | Mobile-first, adaptive sidebar + nav |

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.1.3 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.0.0 |
| Styling | Tailwind CSS v4 + Vanilla CSS | ^4.1.17 |
| Icons | Lucide React | ^0.454.0 |
| 3D Graphics | Three.js + React Three Fiber + Drei | ^0.182.0 |
| Database | Supabase (PostgreSQL) | ^2.105.4 |
| Authentication | Supabase Auth (Google OAuth + Email) | via @supabase/supabase-js |
| Deployment Target | Vercel | — |

### Key Dependencies
- `@react-three/fiber` + `@react-three/drei` — 3D hero section and product stage
- `@supabase/supabase-js` — Database client, auth, and real-time subscriptions
- `lucide-react` — Icon system (consistent, tree-shakeable)
- `class-variance-authority` + `clsx` + `tailwind-merge` — Utility class composition

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Host)                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Next.js App Router                                 │
│  ┌──────────────────────────────────────────────┐   │
│  │  layout.tsx (Root)                            │   │
│  │  ├── ShopProvider (Global Context)            │   │
│  │  │   ├── Supabase Auth Listener               │   │
│  │  │   ├── Products (fetched from DB)           │   │
│  │  │   ├── Orders (fetched per user)            │   │
│  │  │   ├── Cart (local state)                   │   │
│  │  │   ├── Likes (local state)                  │   │
│  │  │   └── Theme + Notifications                │   │
│  │  ├── TopNav (auth-aware)                      │   │
│  │  ├── Sidebar (category filter + nav)          │   │
│  │  ├── CartDrawer (slide-out)                   │   │
│  │  ├── QuickViewModal                           │   │
│  │  ├── NotificationPanel                        │   │
│  │  ├── Chatbot (AI + Voice)                     │   │
│  │  └── {children} ← Page routes                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Routes:                                            │
│  /           → Home (product grid + hero)           │
│  /product/[id] → Product detail page                │
│  /login       → Auth (Google OAuth + Email/Pass)    │
│  /checkout    → Cart review + mock payment          │
│  /orders      → User order history (protected)      │
│  /seller      → Seller dashboard (CRUD + analytics) │
│                                                     │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (Backend-as-a-Service)         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  PostgreSQL  │  │    Auth     │  │  Storage   │  │
│  │  - products  │  │  - Google   │  │  (future)  │  │
│  │  - orders    │  │  - Email    │  │            │  │
│  │  (with RLS)  │  │             │  │            │  │
│  └─────────────┘  └─────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Data Flow Pattern
1. **Products** → Fetched from Supabase on app mount → stored in `ShopContext`
2. **Auth** → Supabase `onAuthStateChange` listener → `user` state in context
3. **Orders** → Fetched when `user` changes → scoped by `user_id` via RLS
4. **Cart / Likes / Theme** → Local React state (no persistence needed for demo)
5. **CRUD (Seller)** → Direct Supabase `insert/update/delete` → re-fetch after mutation

---

## 4. File Structure (Annotated)

```
e-commerce/
│
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout: providers, nav, sidebar, overlays
│   ├── page.tsx                  # Homepage: hero + product grid
│   ├── globals.css               # Global styles, CSS variables, Tailwind config
│   ├── login/page.tsx            # Auth page (Google OAuth + email/password)
│   ├── checkout/page.tsx         # Checkout flow with mock payment
│   ├── orders/page.tsx           # User order history (protected route)
│   ├── seller/page.tsx           # Seller dashboard: stats, orders, inventory CRUD
│   └── product/[id]/page.tsx     # Dynamic product detail page with reviews
│
├── components/                   # Reusable UI components
│   ├── top-nav.tsx               # Fixed top navigation (auth-aware, search, theme)
│   ├── sidebar.tsx               # Left sidebar (categories, seller link, auth link)
│   ├── hero-section.tsx          # 3D animated hero with featured products
│   ├── electric-border-card.tsx  # Product card with SVG turbulence border effect
│   ├── cart-drawer.tsx           # Slide-out cart panel
│   ├── quick-view-modal.tsx      # Product quick-view overlay
│   ├── notification-panel.tsx    # Notification dropdown panel
│   ├── chatbot.tsx               # AI chatbot with voice input/output
│   ├── theme-provider.tsx        # Theme wrapper (dark/light)
│   ├── canvas/                   # Three.js / R3F components
│   │   ├── HeroModel.tsx         # 3D model for hero section
│   │   ├── ProductStage.tsx      # 3D product display stage
│   │   ├── Scene.tsx             # R3F scene wrapper
│   │   └── ShaderBorder.tsx      # Custom GLSL shader border effect
│   └── ui/                       # Shadcn UI primitives (accordion, dialog, etc.)
│
├── contexts/
│   └── shop-context.tsx          # ★ CENTRAL STATE — Auth, Products, Orders, Cart, Theme
│
├── hooks/
│   ├── use-mobile.ts             # Mobile breakpoint detection
│   ├── use-theme.ts              # Theme hook
│   └── use-toast.ts              # Toast notification hook
│
├── lib/
│   ├── supabase.ts               # Supabase client initialization
│   └── utils.ts                  # Utility functions (cn class merger)
│
├── styles/
│   ├── electric-border.css       # ★ Core design system: card effects, nav, sidebar
│   └── globals.css               # Additional global styles
│
├── public/images/                # Product images (served statically)
│   ├── airpods.png
│   ├── RMADRIDKIT.png
│   ├── sneakers.png
│   ├── pteitpain.png
│   ├── iphone-17-pro-max-naranja-cosmico-5.png
│   ├── 10748_2703_00.png
│   ├── spalding-urban-gold-college-jacket-965623.png
│   ├── ASSET_MP_98772542.png
│   └── images.png
│
├── .env.local                    # Supabase keys (NEVER commit this)
├── FIKRA_LABS.md                 # ← YOU ARE HERE
├── package.json
├── tsconfig.json
├── next.config.mjs
└── postcss.config.mjs
```

---

## 5. Database Schema

### `products` table
| Column | Type | Notes |
|---|---|---|
| id | `int8` (PK, auto) | Auto-incrementing primary key |
| name | `text` | Product display name |
| price | `float8` | Price in USD |
| image | `text` | Path like `/images/airpods.png` |
| category | `text` | `Electronics`, `Fashion`, or `Food` |
| description | `text` | Product description |
| likes | `int4` | Like count |
| rating | `float8` | Average rating (1.0–5.0) |
| reviews | `jsonb` | Array of `{ id, user, rating, comment, date }` |

### `orders` table
| Column | Type | Notes |
|---|---|---|
| id | `uuid` (PK, auto) | Auto-generated UUID |
| user_id | `uuid` | References `auth.users.id` |
| items | `jsonb` | Array of product snapshots at time of purchase |
| total | `float8` | Order total in USD |
| status | `text` | `Pending`, `Confirmed`, or `Cancelled` |
| created_at | `timestamptz` | Auto-set on insert |

### Row Level Security (RLS)
- **Products:** Anyone can `SELECT`. Only authenticated users can `INSERT/UPDATE/DELETE`.
- **Orders:** Users can only `SELECT` their own orders. Users can only `INSERT` with their own `user_id`. Users can only `UPDATE` their own orders (for cancellation).

---

## 6. Authentication Strategy

| Method | Status | Notes |
|---|---|---|
| Google OAuth | ✅ Enabled | Primary login method. Requires Google Cloud Console setup. |
| Email/Password | ✅ Enabled | Fallback method. Disable email confirmation in Supabase for testing. |

### Auth Flow
1. User clicks "Sign In" → redirected to `/login`
2. User chooses Google or Email/Password
3. On success → `supabase.auth.onAuthStateChange` fires → `user` state updates in `ShopContext`
4. `TopNav` reacts: hides "Sign In" button, shows user avatar + dropdown (My Orders, Sign Out)
5. `Sidebar` reacts: replaces "Sign In" link with "My Orders" link
6. Protected routes (`/checkout`, `/orders`) redirect to `/login` if `user` is null

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 7. Design System & Conventions

### CSS Architecture
The visual identity is built on **two CSS files**:
- `styles/electric-border.css` — Card effects, sidebar, nav, glow layers, SVG turbulence animation
- `app/globals.css` — CSS variables, Tailwind config, theme tokens, layout utilities

### CSS Variable Naming Convention
All colors use CSS custom properties for automatic dark/light theme support:
```css
--bg-body          /* Page background */
--foreground       /* Primary text */
--card             /* Card backgrounds */
--border-color     /* Borders */
--glass-bg         /* Glassmorphism fill */
--glass-border     /* Glassmorphism border */
--glass-highlight  /* Hover state */
--electric-light-color   /* Accent glow */
--electric-border-color  /* Card border glow */
--muted-foreground       /* Secondary text */
```

### Component Conventions
1. **All components are `"use client"`** — This is a client-rendered SPA wrapped in Next.js App Router
2. **Icons** — Always from `lucide-react`, never inline SVG (except Google logo)
3. **Styling** — Tailwind utility classes + CSS variables. No hardcoded colors.
4. **State** — All shared state lives in `ShopContext`. No prop drilling.
5. **Images** — Stored in `public/images/`, referenced as `/images/filename.png`
6. **Routing** — `useRouter` from `next/navigation` for programmatic navigation

### Performance Rules (Hard-Learned)
- ❌ **NEVER** use `backdrop-blur` on large overlays (causes GPU thrashing)
- ❌ **NEVER** use `mix-blend-multiply` + large blur + `animate-pulse` together
- ✅ Use `filter: blur()` with small values (≤64px) on decorative elements
- ✅ Use `loading="lazy"` on all product images
- ✅ SVG turbulence filter is rendered ONCE in `layout.tsx` and shared by all cards
- ✅ No per-card WebGL canvas — replaced with static CSS effects for performance

---

## 8. Key Components Deep Dive

### `ShopContext` (contexts/shop-context.tsx)
The **brain** of the entire app. A single React Context that manages:
- `user` — Supabase auth state
- `products` — Fetched from Supabase `products` table
- `orders` — Fetched from Supabase `orders` table (per user)
- `cart` — Local array of `Product[]`
- `likedProducts` — Local array of product IDs
- `notifications` — Local notification queue
- `isDarkMode` — Theme toggle
- CRUD operations: `addProduct`, `updateProduct`, `deleteProduct`, `addReview`
- Order operations: `placeOrder`, `cancelOrder`
- Auth: `signOut`

### `Chatbot` (components/chatbot.tsx)
An inventory-aware AI assistant:
- Scans the live `products` array to answer product questions
- Matches user queries to products using keyword filtering
- Supports **voice input** (Web Speech API `SpeechRecognition`)
- Supports **voice output** (Web Speech API `SpeechSynthesis`)
- Provides clickable product links in responses

### `ElectricBorderCard` (components/electric-border-card.tsx)
The signature product card:
- Animated SVG turbulence border effect (shared filter from `layout.tsx`)
- Product image with `mix-blend-multiply` for transparent backgrounds
- Hover reveals: product info overlay + like button
- Click navigates to `/product/[id]`

### `HeroSection` (components/hero-section.tsx)
- Features a 3D scene rendered with React Three Fiber
- Auto-rotating product showcase
- Gradient overlays with call-to-action buttons

### `Seller Dashboard` (app/seller/page.tsx)
- Real-time stats (revenue, orders, customers) calculated from Supabase data
- Orders table with status filters
- Full inventory CRUD (create, edit, delete products)
- Slide-over editor panel with image preview

---

## 9. User Flows

### Visitor (Not Logged In)
```
Homepage → Browse Products → Click Product → Product Detail Page
                                          → Click "Add to Cart" → Cart opens
                                          → Click "Checkout" → Redirected to /login
```

### Customer (Logged In)
```
Homepage → Add to Cart → Checkout → Fill shipping → Mock payment → Order confirmed
                                                                 → Redirected to /orders
/orders → View order history → Cancel pending orders
```

### Seller
```
/seller → View real-time stats → Manage inventory (add/edit/delete products)
       → View incoming orders from all users
```

---

## 10. Deployment Checklist

### Vercel Setup
1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### Supabase Setup
1. Run the SQL schema (create `products` and `orders` tables with RLS)
2. Enable Google provider in Authentication → Providers
3. Set Site URL to your Vercel domain in Authentication → URL Configuration
4. Add Vercel domain to Redirect URLs
5. Disable email confirmation for testing (Authentication → Settings)

### Google OAuth Setup
1. Google Cloud Console → Create OAuth 2.0 credentials
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Paste Client ID + Secret into Supabase Google provider settings

---

## 11. Known Issues & Gotchas

| Issue | Status | Notes |
|---|---|---|
| Email verification links point to `localhost` | ⚠️ | Disable email confirmation in Supabase settings, or update Site URL |
| Google OAuth shows "provider not enabled" | ⚠️ | Must complete Google Cloud Console setup first |
| Products show empty on first load | ✅ Fixed | Products are fetched from Supabase on mount — ensure SQL seed data is inserted |
| `.bak` files in `contexts/` | 🧹 Clean up | Legacy backup file, safe to delete |
| `reviews` column stores JSON | ℹ️ Design choice | Trade-off: simpler schema vs. normalized reviews table. Fine for portfolio scale. |

---

## 12. Future Improvements

- [ ] Supabase Storage for seller image uploads (currently uses local `/images/`)
- [ ] Real-time order notifications via Supabase Realtime subscriptions
- [ ] Product search with full-text search (Supabase `tsvector`)
- [ ] Stripe integration for real payment processing
- [ ] User profile page with order analytics
- [ ] PWA support (offline mode, push notifications)
- [ ] Internationalization (i18n) for multi-language support

---

## 13. Commands

```bash
# Development
npm run dev          # Start local dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

---

> **Last updated:** May 2026
> **Author:** Aymane Eddahhak
> **Stack:** Next.js 15 · React 19 · TypeScript · Supabase · Three.js · Tailwind CSS v4
