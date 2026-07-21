# JUST SHOP — Project Guide & Progress Tracker

> **Purpose:** Single source of truth for any developer or AI agent picking up this project mid-redesign. Read this FIRST before touching any file. It documents the architecture, the 9-phase upgrade roadmap, what's done, what's next, and the rules of engagement.
>
> **Last updated:** After Phase 1, Step 1 (data chokepoint created).

---

## 0. Rules of Engagement (READ FIRST)

1. **No git, no commits, no GitHub.** The user explicitly forbade version control usage. All work happens directly in the working tree. There is NO commit safety net — be careful with destructive operations.
2. **Build must stay green after every phase.** Gate: `npm run typecheck && npm run lint && npm run build`. Do not start the next phase until the current one passes all three.
3. **No code yet without the build passing first.** Verify the baseline before changing anything.
4. **Phase-by-phase execution.** User approved the entire roadmap end-to-end. Execute Phase 0 → 8 sequentially. Each phase ends with a verified green build.
5. **`.env.local` is private.** Never read or commit it. It contains Supabase keys.
6. **Match surrounding code style.** Naming, comments, idioms.

---

## 1. What Is This Project?

**JUST SHOP** (aka FIKRA.LABS) — a Next.js 15 + Supabase e-commerce app, being transformed into a **premium portfolio-quality product** with a real-time WebGL 3D hero. The end goal: a project recruiters at Google/Microsoft/Stripe/Vercel would respect.

### Tech Stack (current)
| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | **15.5.20** (patched in Phase 0) |
| Language | TypeScript (strict) | ^5 |
| UI Library | React | 19.0.0 |
| Styling | Tailwind CSS v4 + raw CSS vars | ^4.1.17 |
| Icons | Lucide React | ^0.454.0 |
| Database | Supabase (PostgreSQL) | ^2.105.4 |
| Auth | Supabase Auth (Google OAuth + Email) | via @supabase/supabase-js |
| Deployment Target | Vercel | — |

### Tech Stack (to be added in Phase 3)
- `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` — 3D hero + product stage
- `gsap` — scroll storytelling (ScrollTrigger)
- `motion` — micro-interactions (Framer Motion v11+)
- `lenis` — smooth scroll

---

## 2. Project Structure (current)

```
e-commerce/
├── app/                          # Next.js App Router
│   ├── auth/callback/route.ts    # OAuth code exchange
│   ├── checkout/page.tsx         # 165 lines — basic mock checkout
│   ├── login/page.tsx            # 476 lines — auth (NEEDS SPLIT in P1)
│   ├── orders/page.tsx           # 144 lines — order history
│   ├── product/[id]/
│   │   ├── layout.tsx            # generateMetadata
│   │   └── page.tsx              # 312 lines CLIENT (NEEDS server-component in P1)
│   ├── seller/page.tsx           # 389 lines (NEEDS SPLIT in P1)
│   ├── globals.css               # 386 lines — mixed tokens + raw vars
│   ├── layout.tsx                # Root layout — wraps everything in ShopProvider
│   ├── page.tsx                  # Home — just renders <HomeCatalog/>
│   ├── robots.ts                 # SEO
│   └── sitemap.ts                # SEO
├── components/                   # UI components
│   ├── cart-drawer.tsx
│   ├── chatbot.tsx               # 351 lines — AI chatbot
│   ├── electric-border-card.tsx # Product card with conic-gradient hover border
│   ├── hero-section.tsx          # CSS marquee (will become WebGL in P3)
│   ├── home-catalog.tsx          # 285 lines — search/filter/sort
│   ├── mobile-nav.tsx
│   ├── notification-panel.tsx
│   ├── quick-view-modal.tsx
│   ├── sidebar.tsx
│   ├── top-nav.tsx
│   ├── video-logo.tsx
│   └── welcome-intro.tsx
├── contexts/
│   ├── shop-context.tsx          # 530 lines — GOD CONTEXT (decompose in P1)
│   └── toast-context.tsx         # Toast notifications
├── lib/
│   ├── get-products.ts           # OLD read helpers (being replaced by queries/)
│   ├── mock-data.ts              # 103 lines — MOCK_PRODUCTS fallback
│   ├── queries/                  # NEW — Phase 1 data chokepoint (server-only)
│   │   ├── orders.ts             # ✅ created
│   │   └── products.ts           # ✅ created
│   ├── storage.ts                # localStorage helpers (cart/likes/theme)
│   ├── supabase-server.ts        # Server client factory
│   ├── supabase.ts               # Browser client
│   ├── types.ts                  # Product, Order, Review, Notification, Toast
│   └── utils.ts                  # cn() helper
├── hooks/
│   ├── use-mobile.ts
│   ├── use-reduced-motion.ts
│   └── use-theme.ts
├── middleware.ts                 # Supabase SSR cookie session refresh
└── public/                       # images/, videos/ (welcome.mp4, waiting.mp4)
```

---

## 3. The 9-Phase Roadmap

| # | Phase | Weight | Status | % of phase done |
|---|---|---|---|---|
| 0 | Stabilize & Tool-up | 5% | ✅ **DONE** | 100% |
| 1 | Architecture Cleanup | 15% | 🟡 **IN PROGRESS** | ~15% |
| 2 | Design System & UI Redesign | 20% | ⬜ pending | 0% |
| 3 | 3D & Motion | 22% | ⬜ pending | 0% |
| 4 | Performance | 10% | ⬜ pending | 0% |
| 5 | SEO & Metadata | 8% | ⬜ pending | 0% |
| 6 | Accessibility (WCAG 2.1 AA) | 8% | ⬜ pending | 0% |
| 7 | Feature Completion | 7% | ⬜ pending | 0% |
| 8 | Production Readiness | 5% | ⬜ pending | 0% |

**Overall project progress: ~7.5%** (Phase 0 done + Phase 1 started)

---

## 4. Phase Details

### ✅ Phase 0: Stabilize & Tool-up — COMPLETE (100%)
**What was done:**
- Patched Next.js `15.1.3 → 15.5.20` (closes RCE/SSRF/cache-poisoning/middleware-bypass CVEs)
- Bumped `eslint-config-next` to match
- Added ESLint 9 flat config (`eslint.config.mjs`) — replaced legacy `next lint` with standalone CLI
- Added Prettier + `prettier-plugin-tailwindcss` (`.prettierrc.json`, `.prettierignore`)
- Added `.editorconfig`, `.nvmrc` (Node 22.12.0)
- Added `@next/bundle-analyzer` — wired into `next.config.mjs`
- Added npm scripts: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `analyze`
- **Bug fixed:** Rules-of-Hooks violation in `app/seller/page.tsx` (3 hooks after early returns — would crash React 19)
- **Bug fixed:** Unescaped entities in `orders/page.tsx` + `product/[id]/page.tsx` (3 build-blocking errors)
- Enabled `reactStrictMode` in `next.config.mjs`

**Files created:**
- `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.nvmrc`

**Files modified:**
- `package.json` (deps + scripts), `next.config.mjs`, `app/seller/page.tsx`, `app/orders/page.tsx`, `app/product/[id]/page.tsx`

**Gate passed:** typecheck ✅ · lint 0 errors (26 warnings, all tracked for later phases) · build ✅ 18.7s

---

### 🟡 Phase 1: Architecture Cleanup — IN PROGRESS (~15%)
**Goal:** Decompose the god-context, server-component the PDP, introduce server actions, single data chokepoint, split oversized files.

**Steps:**
1. ✅ **Data chokepoint** — created `lib/queries/products.ts` and `lib/queries/orders.ts` (server-only, typed, mock-fallback). **NOT YET WIRED** — old `lib/get-products.ts` still in use.
2. ⬜ **Decompose `ShopContext`** (530 lines) into focused providers:
   - `AuthProvider` (user, signOut, signInDemo, authLoading)
   - `CatalogProvider` (products, category, searchQuery, reviews)
   - `CartProvider` (cart, addToCart, removeFromCart, isCartOpen, quickView)
   - `LikesProvider` (likedProducts, toggleLike)
   - `OrdersProvider` (orders, placeOrder, updateOrderStatus, cancelOrder)
   - `ThemeProvider` (isDarkMode, toggleTheme)
   - `NotificationsProvider` (notifications, markAsRead, etc.)
3. ⬜ **Server actions** in `lib/actions/` — `orders.ts` (placeOrder, updateStatus, cancel), `products.ts` (CRUD), `reviews.ts` (addReview). Replace direct browser→Supabase mutations.
4. ⬜ **Wire queries into app** — replace `lib/get-products.ts` imports with `lib/queries/products.ts`. Delete old file last.
5. ⬜ **Convert `product/[id]/page.tsx` to server component** — fetch product server-side, isolate interactive bits (qty, add-to-cart, reviews) into client islands. This is the biggest portfolio win.
6. ⬜ **Split `login/page.tsx`** (476 lines) into `LoginForm`, `SignupForm`, `SocialAuth`, `useAuthFlow` hook.
7. ⬜ **Split `seller/page.tsx`** (389 lines) into `StatCards`, `ProductTable`, `OrderManager`, `ProductFormDialog`.
8. ⬜ **Tighten types** — remove `as any` in `signInDemo`, fix `Partial<Product> & { id?: number }` hacks.

**Phase gate:** typecheck + lint + build all green.

---

### ⬜ Phase 2: Design System & UI Redesign (20%)
- Create `app/tokens.css` — strict spacing/type/radius/color scales mapped to Tailwind
- Re-scaffold shadcn primitives via `npx shadcn@latest add button card dialog input ...` (components.json exists, new-york style)
- Build a `Button`/`Input`/`Card`/`Badge` primitive layer
- Fluid typography with `clamp()`
- Consistent radii (pick 3), hairline borders, real empty/loading/error states
- Redesign: Home, PDP, Checkout, Orders, Seller
- Add `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx` per route segment

---

### ⬜ Phase 3: 3D & Motion (22%) — the "3D videos" phase
**Install:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `gsap`, `motion`, `lenis`, `maath`

**Build:**
- Hero canvas — floating product on pedestal + cursor parallax + Bloom postprocessing
- PDP 360° draggable product stage (`<Stage>` / `<Environment>`)
- GSAP ScrollTrigger scroll storytelling (pinned hero product rotation)
- Lenis smooth scroll
- `motion` micro-interactions (magnetic buttons, fly-to-cart)
- **All lazy-loaded, off-screen-paused, `prefers-reduced-motion`-aware**
- Max 2 concurrent WebGL contexts
- Mobile/low-power fallback to `welcome.mp4`

**Use Context7 MCP for live R3F/Three/GSAP docs** — prevents API hallucination.

---

### ⬜ Phase 4: Performance (10%)
- `npm run analyze` — bundle-analyze, code-split chatbot/modals/3D
- `next/image` everywhere (replace all `<img>`)
- Memoization, virtualized lists if needed
- Target Lighthouse 95+ on all key routes (use chrome-devtools MCP)

---

### ⬜ Phase 5: SEO & Metadata (8%)
- JSON-LD: Product, Offer, AggregateRating, BreadcrumbList, Organization
- Per-product OG images via `ImageResponse`
- URL-synced filters via `nuqs`
- Canonical tags, pagination meta

---

### ⬜ Phase 6: Accessibility (WCAG 2.1 AA) (8%)
- Fix contrast on low-opacity text
- Keyboard nav for custom sort dropdown, focus traps on modals
- Screen-reader labels, skip links
- Reduced-motion compliance
- axe CI gate

---

### ⬜ Phase 7: Feature Completion (7%)
- Wishlist page, recently viewed, product variants (size/color), image zoom
- Coupons/discounts
- Real multi-step checkout + confirmation + order tracking timeline
- Seller dashboard charts (recharts) + admin role
- Stock/inventory count

---

### ⬜ Phase 8: Production Readiness (5%)
- Vitest (unit) + Playwright (e2e for checkout/auth)
- CI: GitHub Actions (lint → typecheck → test → build)
- Vercel config
- Sentry error monitoring
- `@vercel/analytics`, `@vercel/speed-insights`
- README + `antigravity.md` rewrite to match reality

---

## 5. Known Issues & Technical Debt (tracked for later phases)

| Issue | Phase to fix |
|---|---|
| 26 ESLint warnings (`<img>`, `any`, unused vars) | P1 (any), P4 (img) |
| 6 npm audit vulnerabilities (Next.js was critical — FIXED in P0) | P8 final audit |
| God `ShopContext` (530 lines) | **P1** |
| PDP is client component with `useEffect` data fetch | **P1** |
| Filters/search not URL-synced | P5 |
| No error boundaries / loading states | P2 |
| No tests, no CI | P8 |
| Mock checkout (no payment, no confirmation route) | P7 |

---

## 6. MCP Setup (finalized)

| MCP | Status | Purpose |
|---|---|---|
| **Context7** | ✅ connected | Live docs for R3F/Three/GSAP/Next |
| **Playwright** | ✅ connected | e2e tests (P8), cross-browser |
| **chrome-devtools** | ✅ connected | Lighthouse perf (P4), traces |
| ~~shadcn~~ | deleted | Using CLI via Bash instead |
| ~~figma~~ | deleted | No designs to import |

---

## 7. Quick Commands

```bash
npm run dev          # start dev server
npm run build        # production build (THE GATE)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run format       # prettier write
npm run analyze      # ANALYZE=true next build (bundle visualizer)
```

**Build gate before any phase is considered done:**
```bash
npm run typecheck && npm run lint && npm run build
```

---

## 8. Where to Resume

**Currently mid-Phase 1, Step 1 complete.** Next action: decompose `contexts/shop-context.tsx` into focused providers (Step 2). Start by reading `contexts/shop-context.tsx` to understand the full state surface, then build `contexts/providers/` directory with the split providers listed in Phase 1 Step 2. Wire them in `app/layout.tsx` last. After each step, run the build gate.
