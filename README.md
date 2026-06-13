# Siliguri Fresh Mart

Premium quick-commerce platform for fresh fish, chicken, mutton, vegetables, and daily essentials — delivered in 10-30 minutes across Siliguri.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** — animations
- **Zustand** — cart & user state
- **React Query** — data fetching
- **Supabase** — auth & database (optional)
- **Recharts** — admin analytics
- **Radix UI** — accessible primitives

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/fish` | Premium fish experience |
| `/product/[slug]` | Product detail |
| `/search` | Search results |
| `/category/[slug]` | Category listing |
| `/checkout` | Checkout flow |
| `/prime` | Prime membership |
| `/track/[orderId]` | Order tracking |
| `/account/*` | User dashboard |
| `/admin/*` | Admin dashboard |

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Dark Green | `#003D2B` | Primary, trust |
| Fresh Green | `#498B2C` | Freshness, success |
| Royal Blue | `#1D4E9E` | Fish, links |
| Tomato Red | `#E53935` | Flash deals |
| Orange | `#FB8C00` | Trending |
| Gold | `#D4AF37` | Prime membership |

## Build

```bash
npm run build
npm start
```
