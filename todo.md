# FoodScan ($5) door

Result, Nov 16 2026 (0.24.0): paying unlocks unlimited food scans; free users get a small limit. 0.23.3 had removed the limit (free for everyone); 0.24.0 restores it.

## What it does
- Scanning is server side: `POST /api/scan` (auth + CSRF). The server looks the product up on Open Food Facts and rates the ingredients.
- Free limit: `FREE_USAGE_LIMIT` scans per 30-day window, **default 5** (was 20). Shared with `POST /api/usage`. A scan is spent only when a product is found.
- Paid (`active` or `trialing`, period end not passed): unlimited, `remaining: -1`, nothing spent (`is_subscriber`).
- Free user out of scans: 402 `Upgrade to the Monthly Plan for unlimited food scans` before any lookup. The UI (`scanClaim.ts`, HomeView, ScanView) opens the Upgrade Plan sheet.
- Buy path: Settings has Subscribe (Manage once subscribed); the sheet opens checkout for `food_monthly`.

## Prod env overrides the default
Dokploy app `bxfood` has `FREE_USAGE_LIMIT=20`, so prod enforces **20 scans per 30 days**, not 5. To get 5 in prod, change that env var to 5 (or remove it) and redeploy. Not changed here (no env edits without Steve).

## Verified
- `cargo test --locked`: 303 passed, including `a_signed_checkout_webhook_unlocks_scanning_for_the_buyer` (free scan 200, next 402, signed `checkout.session.completed`, then unlimited).
- Browser (own headless Chromium, local backend, default limit): 5 scans 200, 6th shows the Upgrade Plan sheet; Settings shows Subscribe. No live payment.
- Prod health 200 after deploy.

## Left
- Decide whether prod `FREE_USAGE_LIMIT` should drop from 20 to 5.
- The Subscribe side after a real payment is covered by the signed-webhook test only.
