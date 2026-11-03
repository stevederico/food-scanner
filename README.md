# BXFood

Food and nutrition tracking with barcode scanning.

**Version:** 0.21.2 | **Domain:** [food.bixbyapps.com](https://food.bixbyapps.com) | **Railway Service:** `bxfood`

## Tech Stack

- React 19.2, Vite 8.2, skateboard-ui 5.11.0, skateboard 5.6.0
- @zxing/library for barcode scanning
- Zero-crate Rust backend, SQLite
- Tailwind CSS v4

## Setup

```bash
npm install
npm run start          # Frontend :5173
cd backend && cargo run   # Backend :8000
```

## Scripts

- `npm run start` — Frontend only (Vite)
- `npm run build` — Production frontend build
- `cd backend && cargo test --locked` — Backend tests

## Routes

**Public:** `/`, `/terms`, `/privacy`, `/subs`, `/eula`
**Protected:** `/app/*` (authentication required)

## Plans

- Free: `FREE_USAGE_LIMIT` food scans per 30 days (default 20). Barcode scans and product searches each count once a product is found
- Monthly Plan ($5, `food_monthly`): unlimited food scans
- Enforced by `POST /api/scan` (402 when free scans run out). The app then opens the upgrade sheet
- The product lookup (Open Food Facts) and the ingredient rating run on the server behind that gate. The browser never calls Open Food Facts and never gets the ingredient list, so the paywall cannot be skipped from the browser
- Recent scans reopen from the result saved on the device, without another scan

## Deploy

```bash
railway link -p bixby -e production -s bxfood
railway up
```

---

<div align="center">
  Made with <a href="https://github.com/stevederico/skateboard">Skateboard</a> — a React boilerplate with auth and payments
</div>
