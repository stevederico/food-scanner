# API Reference

## Overview

The Skateboard backend provides a RESTful API for authentication, user management, payments, and usage tracking. All endpoints are prefixed with `/api`.

## Authentication

Authentication uses JWT tokens stored in HttpOnly cookies with CSRF protection.

### Headers

State-changing requests (POST, PUT, DELETE) require a CSRF token:
```
X-CSRF-Token: <csrf_token>
```

### Cookie Authentication

The `token` cookie is automatically sent with credentials. No manual token handling required.

---

## Endpoints

### Authentication

#### POST /api/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Validation:**
- `name`: 1-100 characters
- `email`: Valid email, max 254 characters
- `password`: 6-72 characters

**Response (200):**
```json
{
  "_id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": 1704067200,
  "subscription": null,
  "usage": { "count": 0, "reset_at": null }
}
```

**Cookies Set:**
- `token`: JWT token (HttpOnly, 30 days)
- `<appname>_csrf`: CSRF token (24 hours)

---

#### POST /api/signin
Sign in to existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "_id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": 1704067200,
  "subscription": {
    "stripeID": "cus_xxx",
    "status": "active",
    "expires": 1735689600
  }
}
```

**Cookies Set:** Same as signup

---

#### POST /api/signout
Sign out current user.

**Response (200):**
```json
{ "message": "Signed out successfully" }
```

**Cookies Cleared:** `token`, `<appname>_csrf`

---

### User Management

#### GET /api/me
Get current authenticated user.

**Response (200):**
```json
{
  "_id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": 1704067200,
  "subscription": { ... },
  "usage": { "count": 5, "reset_at": 1706745600 }
}
```

---

#### PUT /api/me
Update current user profile.

**Request Body:**
```json
{
  "name": "New Name"
}
```

**Response (200):**
```json
{
  "_id": "uuid",
  "email": "john@example.com",
  "name": "New Name",
  ...
}
```

---

### Subscription

There is no separate subscription-status route. Read it from `POST /api/usage` with `{"operation":"check"}` (below): `isSubscriber` is `true` when the user's subscription status is in `PAID_STATUSES` (`active` or `trialing`) and its period end has not passed (no period end counts as current), otherwise `false`.

---

### Usage Tracking

#### POST /api/usage
Check or track usage for free users.

**Request Body:**
```json
{
  "operation": "check"
}
```
or
```json
{
  "operation": "track"
}
```

**Response (200) - Free User:**
```json
{
  "remaining": 15,
  "total": 20,
  "isSubscriber": false,
  "used": 5,
  "subscription": null
}
```

**Response (200) - Subscriber:**
```json
{
  "remaining": -1,
  "total": -1,
  "isSubscriber": true,
  "subscription": {
    "status": "active",
    "expiresAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Response (429) - Limit Reached:**
```json
{
  "error": "Usage limit reached",
  "remaining": 0,
  "total": 20,
  "isSubscriber": false
}
```

#### POST /api/scan
Scan one food product: the paid feature. The server looks the product up on
Open Food Facts (`PRODUCT_API_URL`, default `https://us.openfoodfacts.org`) and
rates its ingredients against `backend/src/bad_ingredients.json`, both behind the
plan gate, so a rated product never reaches the browser without passing it. The
browser does not call Open Food Facts and does not ship the ingredient list
(it is not in the CSP `connect-src`). Requires auth and CSRF.

Active subscribers (Monthly Plan) are unlimited. A free user with no scans left in
the `FREE_USAGE_LIMIT` window (the same counter `POST /api/usage` tracks) gets 402
before any lookup. Otherwise the product is looked up and one scan is spent only
when it is found; 404 (not found) and 502 (lookup failed) spend nothing.

**Request Body:** `{"code": "3017620422003"}` (barcode, ASCII letters and digits, up
to 64) or `{"query": "nutella"}` (name search, up to 200 characters; an all-digit
query is treated as a barcode). Anything else answers 400.

**Response (200) - Free User:**
```json
{
  "allowed": true,
  "remaining": 19,
  "total": 20,
  "isSubscriber": false,
  "product": { "code": "3017620422003", "product_name": "Nutella", "image_url": "https://images.openfoodfacts.org/..." },
  "ingredients": [{ "text": "Sugar", "color": "red" }, { "text": "Hazelnuts", "color": null }],
  "approved": false
}
```

**Response (200) - Subscriber:** same body with `"remaining": -1`, `"total": -1`,
`"isSubscriber": true`.

**Response (404):** `{"error": "Product not found"}` (no scan spent)

**Response (502):** `{"error": "Product lookup failed. Try again."}` (no scan spent)

**Response (402) - Free Scans Used Up:**
```json
{
  "error": "Upgrade to the Monthly Plan for unlimited food scans",
  "upgradeRequired": true,
  "remaining": 0,
  "total": 20,
  "isSubscriber": false
}
```

---

### Payments (Stripe)

#### POST /api/checkout
Create Stripe checkout session.

**Request Body:**
```json
{
  "email": "john@example.com",
  "lookup_key": "premium_monthly"
}
```

**Response (200):**
```json
{
  "url": "https://checkout.stripe.com/...",
  "id": "cs_xxx",
  "customerID": "cus_xxx"
}
```

---

#### POST /api/portal
Create Stripe billing portal session.

**Request Body:**
```json
{
  "customerID": "cus_xxx"
}
```

**Response (200):**
```json
{
  "url": "https://billing.stripe.com/...",
  "id": "bps_xxx"
}
```

---

#### POST /api/payment
Stripe webhook endpoint. Handles subscription events.

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

### Health Check

#### GET /api/health
Health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "database": "connected"
}
```

---

## Rate Limiting

| Route Type | Limit | Window |
|------------|-------|--------|
| Auth routes (`/signin`, `/signup`) | 10 requests | 15 minutes |
| Payment routes (`/checkout`, `/portal`) | 5 requests | 15 minutes |
| All other routes | 300 requests | 15 minutes |

Rate limit headers:
- `X-RateLimit-Remaining`: Requests remaining
- `Retry-After`: Seconds until limit resets (on 429)

---

## Error Responses

All errors return JSON with an `error` field:

```json
{ "error": "Error message here" }
```

### Status Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Invalid CSRF or permission denied |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Auth disabled |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `STRIPE_KEY` | Stripe secret key | Yes |
| `STRIPE_ENDPOINT_SECRET` | Stripe webhook secret | Yes |
| `FREE_USAGE_LIMIT` | Monthly limit for free users | No (default: 20) |
| `PRODUCT_API_URL` | Open Food Facts origin used by `POST /api/scan` | No (default: `https://us.openfoodfacts.org`) |
| `CORS_ORIGINS` | Comma-separated allowed origins | No |
| `FRONTEND_URL` | Frontend URL for redirects | No |
| `PORT` | Server port | No (default: 8000) |
