# BXFood

Food and nutrition tracking with barcode scanning.

**Version:** 0.16.0 | **Domain:** [food.bixbyapps.com](https://food.bixbyapps.com) | **Railway Service:** `bxfood`

## Tech Stack

- React 19.2, Vite 8.2, skateboard-ui 5.1.0, skateboard 5.6.0
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

## Deploy

```bash
railway link -p bixby -e production -s bxfood
railway up
```

---

<div align="center">
  Made with <a href="https://github.com/stevederico/skateboard">Skateboard</a> — a React boilerplate with auth and payments
</div>
