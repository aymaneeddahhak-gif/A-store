# JUST SHOP — Premium E-Commerce

A production-oriented Next.js e-commerce experience with Supabase auth, seller dashboard, and a refined glass UI.

## Features

- **Catalog** — Server-loaded products, search, filters, sort, hero marquee
- **Commerce** — Cart (persisted), quick view, checkout, order history
- **Auth** — Email/password, Google OAuth, demo seller access
- **Seller** — Product CRUD and order management
- **UX** — Mobile navigation, toasts, dark/light theme, reduced-motion support
- **SEO** — Per-product metadata, sitemap, robots.txt

## Tech stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict build)
- **Tailwind CSS 4**
- **Supabase** (auth + database)

## Getting started

```bash
npm install
cp .env.example .env.local   # add Supabase keys + NEXT_PUBLIC_SITE_URL
npm run dev
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for SEO (e.g. `https://yourdomain.com`) |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build (TypeScript + ESLint enforced)
- `npm run start` — run production build
- `npm run lint` — ESLint

## Project structure

```
app/              Routes, layouts, global styles
components/       UI (nav, cards, modals, catalog)
contexts/         Shop state + toast notifications
lib/              Supabase, types, server data fetching
hooks/            Shared client hooks
public/           Static assets
```

## License

MIT
