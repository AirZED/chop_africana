# Chop Africana

A full site for a pie business: a marketing **landing page** (`/`), a **restaurant
order & pay app** (`/order` → menu → cart → checkout, mode select for Pickup / Delivery
/ QR Dine-In), and a **shop** for the retail frozen-pie line (`/shop` → product → cart →
checkout, shipped). Both checkouts run on Stripe. An **admin panel** (`/admin`) manages
the restaurant menu and shows a financial analytics dashboard across both channels — all
backed by a real database.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind CSS v4)
- **SQLite** (`better-sqlite3`) — menu catalog, shop products, and order history,
  auto-seeded on first run
- **Zustand** for cart state: the restaurant order cart (persisted to `localStorage`) and
  the shop cart (also persisted) are deliberately separate stores, since they represent
  different fulfillment models (dine-in/pickup/delivery vs. shipping)
- **Stripe** — Payment Intents API, Elements (`ExpressCheckoutElement` for Apple Pay /
  Google Pay, `PaymentElement` for cards), shared by both checkouts
- **Recharts** for the analytics revenue chart

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in Stripe keys + set an admin password
npm run dev
```

- [http://localhost:3000](http://localhost:3000) — the marketing landing page
- [http://localhost:3000/order](http://localhost:3000/order) — the restaurant order app (mobile-width)
- [http://localhost:3000/shop](http://localhost:3000/shop) — the pie shop
- [http://localhost:3000/admin](http://localhost:3000/admin) — the admin panel

The SQLite file is created at `data/app.db` on first run and seeded automatically —
nothing to migrate by hand.

### Real photography isn't wired in yet

Every image slot on the landing page and shop (hero, pie product shots, kitchen/graduation
CTA photos, step photos, store thumbnails) renders a labeled `ImagePlaceholder`
(`src/components/ImagePlaceholder.tsx`) instead of a fake stock photo — each one names the
exact file it's expecting (e.g. `hero-pies.jpg`). Swap a slot by replacing that call site
with a real `<img>`/`next/image`.

### Stripe keys

Grab test-mode keys from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys)
and put them in `.env.local`:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

Card checkout works with those two alone, on both the restaurant and shop checkouts. To
see Apple Pay / Google Pay buttons in the Express Checkout row you'll also need to serve
over HTTPS (or `localhost`, which Stripe treats as secure) with a device/browser that has
a wallet configured — otherwise that row just renders empty and the `PaymentElement` card
form still works.

`STRIPE_WEBHOOK_SECRET` is optional — only needed if you run
`stripe listen --forward-to localhost:3000/api/webhook` for the authoritative
production-style confirmation path. Without it, a fallback route
(`/api/confirm-order`) verifies the PaymentIntent directly with Stripe right after
checkout so local orders still land correctly in the database and analytics — see
"Order lifecycle" below.

### Admin panel

```
ADMIN_PASSWORD=choose-a-real-password
ADMIN_SESSION_SECRET=openssl rand -hex 32
```

Both are required — the admin routes (`/admin/*` and `/api/admin/*`) refuse to work
without them. Auth is a single shared password (no user accounts) behind an HMAC-signed,
`httpOnly` session cookie good for 12 hours — intentionally minimal for a single-operator
admin panel, not a multi-user permissions system.

## How it's wired

### Landing page (`src/app/page.tsx`, `src/components/site/`)

`SiteHeader` / `SiteFooter` are shared chrome for the landing page and the whole `/shop`
section. `StepsCarousel` and `StoreLocator` are their own client components (interactive
carousel state; live search over the store list). The store locator embeds a real Google
Maps iframe via the no-API-key `output=embed` URL, centered on the address in the footer —
swap `MAP_QUERY` in `StoreLocator.tsx` for your real coordinates/address once you have them.

### Restaurant order app (`src/app/(storefront)/`, entry at `/order`)

- `src/lib/menu-service.ts` — reads/writes the restaurant menu catalog in SQLite,
  converting between pence (DB) and pounds (`MenuItem`, the app-wide shape)
- `src/lib/pricing.ts` — price/validation logic shared by the client **and** the server
  API route; every function takes the live catalog as an explicit argument (never a
  static import) so a tampered client-side price can never be charged and admin price
  changes take effect immediately
- `src/lib/menu-store.ts` — client-side Zustand cache of `GET /api/menu` (active items only)
- `src/lib/store.ts` — Zustand store for order mode, guest/table/delivery info, and cart
- `(storefront)/order/page.tsx` — mode select (auto-detects `?table=` from a QR code URL)
- `(storefront)/menu/page.tsx` — sticky category pills + item list + sticky cart bar
- `src/components/CustomizerSheet.tsx` — bottom sheet for required/optional modifiers
- `(storefront)/cart/page.tsx` — order review, edit/remove line items
- `(storefront)/checkout/page.tsx` + `src/components/CheckoutForm.tsx` — creates a
  PaymentIntent server-side (`api/create-payment-intent`, which recomputes the total from
  the live DB catalog and writes a `pending` order) and confirms it with Stripe Elements
- `(storefront)/confirmation/page.tsx` — success screen, handles both the in-page checkout
  path and Stripe's redirect-based payment methods

The menu content seeded here (burgers/fries/drinks) is placeholder — same spirit as the
image placeholders — swap it for the real kitchen menu via the admin Products page
whenever you're ready; nothing about the flow depends on the specific dishes.

### Shop (`src/app/shop/`) — the retail frozen-pie line

A separate, simpler e-commerce flow: no modifiers, just a product, a quantity, a shipping
address, and Stripe. `src/lib/shop-service.ts` reads the `shop_products` table (seeded with
Beef Pie / Chicken Pie); `src/lib/shop-pricing.ts` adds a flat shipping fee (free over $30)
on top of the shared tax logic from `pricing.ts`. `src/lib/shop-cart-store.ts` is the
persisted cart. `api/shop/create-payment-intent` mirrors the restaurant one but writes
orders with `channel = 'shop'` and a shipping address instead of a fulfillment mode.

### Order lifecycle

Every checkout attempt (restaurant or shop) writes an `orders` row (status `pending`,
`channel` = `restaurant` or `shop`) with a snapshot of each line item (`order_items`) at
the moment the PaymentIntent is created. Two paths mark it `paid`/`failed`, both
idempotent and both re-verifying against Stripe (never trusting the client):
`api/webhook` (the production path, needs `stripe listen` or a real webhook endpoint) and
`api/confirm-order` (a same-request fallback both checkout flows call right after
`stripe.confirmPayment()` resolves, so local dev works without webhook setup).

### Admin (`src/app/admin/`, `src/app/api/admin/`)

- `src/lib/admin-auth.ts` + `src/proxy.ts` — session cookie issuance/verification (Web
  Crypto, so it works in the Edge-run proxy) gating every `/admin` and `/api/admin` route
- `admin/products/` — manages the **restaurant** menu: list, create, edit, delete, and
  toggle active/hidden; a hidden item stays in the DB but is excluded from `GET /api/menu`
  and from ordering (re-checked server-side at checkout, not just client-side). Shop
  products aren't in the admin UI yet — edit `src/lib/seed-shop.ts` or the `shop_products`
  table directly for now
- `src/components/admin/ProductForm.tsx` — shared create/edit form, including a dynamic
  modifier-group editor (add/remove groups and options, required + max-selections)
- `admin/analytics/` + `api/admin/analytics` — revenue over time, revenue by fulfillment
  mode (restaurant modes plus a "Shop (Shipped)" bucket for pie orders), top-selling
  items, and a recent-orders table across **both** channels, aggregated straight from SQL
  (`src/lib/order-service.ts`) over a selectable date range. Chart colors use a validated
  categorical/sequential palette: a fixed color per mode (never re-assigned by rank) and
  one sequential blue for magnitude (revenue line, top-items bars).

### Mobile engineering details baked in (`globals.css`)

- 16px font-size on all inputs (prevents iOS Safari's forced input zoom)
- `env(safe-area-inset-bottom)` padding on floating sticky bars
- 44×44px minimum touch targets on every tappable element
- `scroll-behavior: smooth` + `scroll-margin-top` so anchor jumps (category pills, the
  landing page's "Get in stores" links) land below sticky headers
