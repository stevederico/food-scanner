# BXFood

Food and nutrition tracking with barcode scanning.

**Version:** 0.9.3 | **Domain:** [food.bixbyapps.com](https://food.bixbyapps.com) | **Railway Service:** `bxfood`

## Tech Stack

- React 19.2, Vite 7.1, skateboard-ui 1.2.20
- @zxing/library 0.21.3 for barcode scanning
- Hono backend, SQLite database
- Tailwind CSS v4

## Setup

```bash
deno install
deno run start    # Frontend :5173 + Backend :8000
```

## Scripts

- `deno run start` — Development (frontend + backend)
- `deno run build` — Production build
- `deno run prod` — Deploy to Railway

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
