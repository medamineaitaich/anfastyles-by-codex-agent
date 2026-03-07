# AnfaStyles Headless Storefront

Production-oriented headless WooCommerce storefront for **AnfaStyles**, built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS**.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- WooCommerce Store API and WooCommerce REST API
- Secure server-side session cookies for account access
- Playwright smoke tests for key local flows

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set:

```bash
NEXT_PUBLIC_WP_BASE_URL=https://wp.anfastyles.shop/
WC_CONSUMER_KEY=...
WC_CONSUMER_SECRET=...
SESSION_SECRET=...
```

3. Start the app:

```bash
npm run dev
```

4. Build for production validation:

```bash
npm run build
```

5. Run local browser checks:

```bash
npm run test:e2e
```

## Implemented pages

- `/`
- `/shop`
- `/shop/[slug]`
- `/about`
- `/contact`
- `/cart`
- `/checkout`
- `/login`
- `/register`
- `/account`
- `/account/orders`
- `/account/orders/[id]`
- `/account/tracking`
- `/terms`
- `/privacy`
- `/refund-policy`
- `/faq`

## Integration notes

- Public catalog data uses WooCommerce product and category endpoints.
- Product detail pages pull variations, grouped items, related products, and reviews from WooCommerce.
- Cart state is managed in the Next.js frontend and persisted in local storage.
- Checkout creates real WooCommerce orders through secure server-side API calls.
- Account registration creates WooCommerce customers and stores a secure Next.js session cookie.
- Login is validated against the WordPress login surface from the server, so Woo secrets never reach the browser.
- Order history falls back to billing email matching because Woo order filters are inconsistent on this backend.

## Verified locally

- Homepage rendering
- Shop listing and search-backed product loading
- Product detail rendering
- Variation selection and add-to-cart drawer
- Cart page
- Authenticated checkout and Woo order creation
- Account registration
- Login and logout cycle

## Backend limitations found during testing

- Woo customer lookup by `email` query was unreliable on this backend, so the app now matches customers locally from recent customer results.
- Woo order filtering by `customer` was inconsistent, so order history also falls back to billing email matching.
- Password change is exposed in the UI, but the backend did not consistently confirm WordPress auth sync after Woo customer password updates. The route now reports that limitation instead of claiming success.

## Hosting notes

- The app is structured to run as a standard Node.js Next.js app, which keeps it compatible with Hostinger Node app hosting.
- No production deployment was performed.
