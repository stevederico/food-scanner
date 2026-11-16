# FoodScan ($5) door

Result, Nov 16 2026: paying unlocks unlimited food scans. The paywall was already built and deployed in 0.19.0 to 0.21.0; this session added the end-to-end door test and played it in a browser.

## What it does
- Scanning is server side: `POST /api/scan` (auth + CSRF). The server looks the product up on Open Food Facts and rates the ingredients.
- Free limit: `FREE_USAGE_LIMIT` scans per window (default 20 per 30 days), shared with `POST /api/usage`. A scan is spent only when a product is found.
- Paid (`active` or `trialing`, period end not passed): unlimited, `remaining: -1`, nothing spent.
- Free user out of scans: 402 `Upgrade to the Monthly Plan for unlimited food scans` before any lookup. The UI (`scanClaim.ts`, HomeView, ScanView) opens the UpgradeSheet.
- Buy path: Settings has Subscribe (Manage once subscribed); the UpgradeSheet opens checkout for `food_monthly`.

## Verified
- `cargo test --locked`: 303 passed. New: `a_signed_checkout_webhook_unlocks_scanning_for_the_buyer` (free scan 200, next 402, signed `checkout.session.completed`, then unlimited with `remaining: -1`).
- Browser (own headless Chromium, local backend, `FREE_USAGE_LIMIT=1`): signup, first scan 200 (Nutella), second scan 402 with "Upgrade Plan" sheet, Settings shows Subscribe. No live payment.
- Prod `https://food.bixbyapps.com/api/health` 200 (needs a browser User-Agent; bare curl gets a Cloudflare 403). Running image `769b242` already contains the paywall.

## Left
- 0.23.2 (test only, plus the Railway cleanup commit `9c28497`) is committed locally but NOT pushed and not redeployed: `origin` (stevederico/food-scanner) is PUBLIC, and the brief allows pushes to private repos only. Steve to decide: make the repo private, or approve the push. The redeploy has no runtime change, so it can wait.
- Not exercised in the browser: the paid side after a webhook (needs Stripe retrieve; covered by the signed-webhook unit test).
