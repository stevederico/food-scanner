# FoodScan ($5) door

Decision, Nov 16 2026 (Steve): FoodScan is free and open source, so there is no scan limit. The 402 gate from 0.19.0 to 0.21.0 is removed in 0.23.2.

## State
- `POST /api/scan` is open to every signed-in user: `remaining: -1`, nothing counted. `isSubscriber` still reports the plan.
- `cargo test --locked` passes. New test: a free user scans repeatedly with `FREE_USAGE_LIMIT=0`.
- The $5 `food_monthly` plan still exists and now unlocks nothing (its features list still says "Unlimited Food Scans", which is now true for everyone).

## Left
- Decide the $5 plan: drop `stripeProducts` from `src/constants.json`, the `food_monthly` proxy route and the Stripe env, or give it a real perk.
- The frontend still handles a 402 (`scanClaim.ts`, UpgradeSheet) but the server never sends one. Harmless dead path.
