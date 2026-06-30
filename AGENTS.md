## Required: Vercel Environment Variables
These MUST be set in Vercel Dashboard → Project Settings → Environment Variables:
```
COOKIE_SECRET=a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
```
(Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
If missing, cookie signing fails and admin/delivery pages return 401.
Note: Do NOT use NEXT_PUBLIC_ prefix — the secret must stay server-side only.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Required: Supabase Realtime
Run this in Supabase Dashboard → SQL Editor before Realtime delivery updates work:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```
(SQL is already in migration files — just needs execution against the live project)

## Required: Razorpay Webhook
1. Go to Razorpay Dashboard → Settings → Webhooks → Add New Webhook
2. URL: `https://siliguri-fresh-market.vercel.app/api/payment/webhook`
3. Events: `payment.captured`, `order.paid`
4. Copy the generated webhook secret into `RAZORPAY_WEBHOOK_SECRET` in Vercel env vars

## Required: Resend Domain Verification
1. Go to https://resend.com → Domains → Add Domain
2. Enter your sending domain (e.g. `siligurifreshmart.com`)
3. Add the DKIM/SPF DNS records at your DNS provider
4. Verify domain in Resend
5. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Vercel env vars

## Goal
Make the site production-ready with delivery code verification, premium checkout/tracking, and polished auth pages.

## Constraints & Preferences
- Three admin emails only — passwords stored as Vercel env vars `ADMIN_PASSWORD_1/2/3`
- All code must compile cleanly (no TypeScript errors)
- Vercel production at `siliguri-fresh-market.vercel.app` (custom domain `siligurifreshmart.com` pending DNS)
- Supabase project: `nkjqbgguuujlxebkjgfo` — orders have 18+ columns including `delivery_code`
- Delivery code is for **customer verification only** — never shown to delivery boy in their app
- Delivery boy must ask customer for the 4-digit code to confirm delivery
- Password minimum 8 characters on signup

## Progress
### Done
- **Checkout page** (`src/app/(shop)/checkout/page.tsx`): premium single-page layout with glass-morphism cards, gradient icon containers, payment radio buttons, UPI fallback modal, collapsible coin banner
- **Cart drawer** (`src/components/cart/cart-drawer.tsx`): premium slide-out with gradient header, glass-morphism bg, rounded-2xl item cards, coupon section
- **Delivery confirmation code system**:
  - Types: `deliveryCode` in `Order` and `DeliveryAssignment`
  - Order store: generates 4-digit code in `createOrder`, `confirmDelivery(code)` calls `/api/delivery/confirm`
  - Admin orders API stores `delivery_code` + `payment_status`
  - Confirm API (`POST /api/delivery/confirm`): verifies code vs DB, sets `delivery_status=delivered`, marks COD as `paid`
  - Customer track page: shows code with copy button when `out_for_delivery` or `delivered`
  - Delivery boy page: **code badge removed** — boy never sees the code, only enters what customer provides
- **Delivery assignments loading**: API (`GET /api/delivery/assignments?boy_id=xxx`) now queries `orders` table directly (was incorrectly querying empty `delivery_assignments` table)
- **Layout mapper fixed** (`src/app/delivery/layout.tsx`): `orderToAssignment` now includes `deliveryCode` + `paymentStatus` + proper `status` mapping
- **Customer track page fixed** (`src/app/(shop)/track/[orderId]/page.tsx`): raw DB snake_case fields (`delivery_code`) now mapped to camelCase `Order` type with full field coverage — code badge appears correctly
- **Picked Up stage added** to customer tracking timeline: `received → picked_up → out_for_delivery → delivered`. Activates when `deliveryStatus === "picked_up"`. Shows "On the way to you!" text
- **Footer hidden** on checkout page (`src/app/(shop)/layout.tsx`): uses `usePathname()` — hides `<Footer />` when `pathname === "/checkout"`
- **Auth pages redesigned**: premium card layout with gradient backgrounds, password show/hide toggles, 8-char minimum validation with live Check/X indicator on signup
- **Admin custom weights**: weight input field (comma-separated) in Add/Edit product forms — stored as `string[]`
- **CSP fixed**: Razorpay subdomains allowed
- **Leaflet installed** + LiveMap component supports boy/customer/store markers
- **Supabase migration applied**: `delivery_locations` table + `delivery_code` column live
- **TypeScript**: compiles clean (`npx tsc --noEmit`)
- **Committed + pushed**: all changes on `master` (latest commit `c027051`)
- **Checkout address overhaul**: inline address creation form (no redirect), "Use My Location" button w/ `useGeolocation`, GPS coords saved with address, animated pulse + red border + auto-scroll on missing address
- **Checkout address premium polish**: red glow/shadow + scale animation on missing address, "Address Required" banner with bouncing alert icon, red-tinted icon container, "Missing" badge pulse, GPS coords display badge on saved address, larger + more prominent "Use My Location" buttons
- **Delivery boy page** (`src/app/delivery/page.tsx`): LiveMap showing boy (green) + customer (red) markers with live distance badge, GPS status card with pulsing Live indicator + coordinates, Haversine distance calculation per delivery card
- **Customer track page** (`src/app/(shop)/track/[orderId]/page.tsx`): dynamic ETA from boy's GPS speed (`speed * 3.6` km/h), live countdown timer ticking every minute, "Arriving in ~X min" pill badge, boy's speed shown in map overlay, "Updated at HH:MM:SS" timestamp
- **Admin delivery page** (`src/app/admin/delivery/page.tsx`): ETA badge per delivery (computed from distance + estimated speed), distance-away label, last-updated timestamp ("X min ago", "Just now"), stale GPS indicator (amber dot if >5 min), `calcDistance` Haversine function

### In Progress
- *(none — all tracking features completed)*

### Blocked
- **Custom domain DNS not configured**: `siligurifreshmart.com` added to Vercel but nameservers still at Hostinger parking. Need A record `76.76.21.21` or Vercel nameservers
- **Resend domain not verified**: DKIM/SPF DNS records not yet applied at Hostinger
- **Razorpay in test mode**: current keys `rzp_test_T3eebwyzkSd5mE` — wants live keys

## Key Decisions
- Delivery code visible to **customer only** — delivery boy enters it from customer's verbal/written code, never sees it in-app
- Delivery assignments loaded from `orders` table by `delivery_boy_id` (not `delivery_assignments` table which is never written to)
- Delivery page fetches codes from 3 fallback sources: assignment object → order store → direct `/api/delivery/orders` API
- Customer track page maps raw DB snake_case → camelCase TypeScript for all order fields including `deliveryCode`
- Footer hidden on checkout to reduce distraction during payment flow
- GPS location stored per-address via `useGeolocation` — passed into `createOrder` as `lat`/`lng`

## Next Steps
1. Point DNS at Hostinger: A record `@` → `76.76.21.21` + CNAME `www` → `cname.vercel-dns.com`
2. Get live Razorpay keys from user

## Critical Context
- `notification` table has FK issue on Vercel — needs `user_id` type change or removal from realtime publication
- `delivery_assignments` table exists but is never written to — all assignment data comes from `orders` table via `delivery_boy_id`
- 4-digit delivery code generated client-side in `createOrder`, stored in DB during order creation, verified server-side by `/api/delivery/confirm`
- Customer track page shows Picked Up stage when `deliveryStatus === "picked_up"` — order `status` stays `out_for_delivery` during this phase
- Checkout uses `useGeolocation` hook for live location — geo button in both inline creation form and existing address edit form

## Relevant Files
- `src/app/(shop)/checkout/page.tsx`: checkout page — inline address creation + live location + animated warning (DONE)
- `src/app/delivery/page.tsx`: delivery boy page — LiveMap showing boy + customer markers, GPS status card, distance badges (DONE)
- `src/app/(shop)/track/[orderId]/page.tsx`: customer tracking — Picked Up stage, dynamic ETA, live countdown, speed overlay (DONE)
- `src/app/api/delivery/assignments/route.ts`: queries `orders` table directly for delivery codes
- `src/app/delivery/layout.tsx`: `orderToAssignment` maps `deliveryCode`, `paymentStatus`, `deliveryStatus`
- `src/app/(shop)/layout.tsx`: hides footer on checkout via `usePathname()`
- `src/app/admin/delivery/page.tsx`: admin delivery — ETA per delivery, last-updated timestamps, stale GPS indicator (DONE)
- `src/components/maps/LiveMap.tsx`: Leaflet map with boy/customer/store markers
- `src/lib/hooks/use-geolocation.ts`: geolocation hook
