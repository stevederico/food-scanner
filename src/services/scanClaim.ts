/**
 * Client for `POST /api/scan`, the server-side food scan.
 *
 * Unlimited food scans are the Monthly Plan's paid feature. The backend looks
 * the product up on Open Food Facts and rates its ingredients itself, behind
 * the plan gate: active subscribers are admitted, everyone else spends one free
 * scan per found product and gets 402 once the free scans are gone. The browser
 * never calls Open Food Facts and never sees the ingredient list, so the only
 * way to a rated product is through this gate.
 *
 * This module turns the answer into a {@link ScanClaim} the views can act on
 * (show the result, or the upgrade path). It takes the backend URL and CSRF
 * reader as arguments so it has no shell imports and runs under `node --test`.
 */

/** Color the server gave a listed ingredient. */
export type IngredientColor = 'red' | 'yellow' | 'green';

/** One ingredient of a scanned product, rated by the server. */
export interface RatedIngredient {
  text: string;
  /** Null when the ingredient is not on the list */
  color: IngredientColor | null;
}

/** The product fields the app shows. */
export interface ScannedProduct {
  code: string;
  product_name: string;
  image_url: string;
}

/** A scanned, rated product as returned by `POST /api/scan`. */
export interface ScanResult {
  product: ScannedProduct;
  ingredients: RatedIngredient[];
  /** False when any ingredient is red or scores above the badness threshold */
  approved: boolean;
}

/** What to scan: a barcode, or a name (or barcode) typed in the search box. */
export type ScanTarget = { code: string } | { query: string };

/** Outcome of one scan. */
export type ScanClaim =
  | { status: 'allowed'; remaining: number; result: ScanResult }
  | { status: 'upgrade'; message: string }
  | { status: 'error'; message: string };

/** Dependencies for {@link claimScan}; `fetchImpl` defaults to global fetch. */
export interface ClaimScanOptions {
  /** Backend base URL, e.g. `getBackendURL()` ("/api" in production) */
  backendURL: string;
  /** Reads the current CSRF token; called again before the one retry */
  getCsrfToken: () => string | null;
  /** Fetch implementation (tests pass a stub) */
  fetchImpl?: typeof fetch;
}

/** Shown when the 402 body has no message of its own. */
export const UPGRADE_MESSAGE = 'Upgrade to the Monthly Plan for unlimited food scans';

/** Shown on 404: Open Food Facts has no such product. Spends no scan. */
export const NOT_FOUND_MESSAGE = 'Product not found. Try another barcode or name.';

const GENERIC_ERROR = 'Could not finish the scan. Check your connection and try again.';
const SIGNED_OUT_ERROR = 'Your session ended. Sign in again to keep scanning.';
const HTTP_PAYMENT_REQUIRED = 402;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const COLORS: readonly string[] = ['red', 'yellow', 'green'];

/** True for a non-null, non-array object. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isColor = (value: unknown): value is IngredientColor =>
  typeof value === 'string' && COLORS.includes(value);

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * Read a {@link ScanResult} out of an untrusted body.
 *
 * @param body - Parsed JSON body
 * @returns The result, or null when the body has no product
 */
export function parseScanResult(body: unknown): ScanResult | null {
  if (!isRecord(body) || !isRecord(body.product)) return null;
  const { product } = body;
  const ingredients = Array.isArray(body.ingredients)
    ? body.ingredients.filter(isRecord).map((ing) => ({
        text: text(ing.text),
        color: isColor(ing.color) ? ing.color : null,
      }))
    : [];
  return {
    product: {
      code: text(product.code),
      product_name: text(product.product_name),
      image_url: text(product.image_url),
    },
    ingredients: ingredients.filter((ing) => ing.text),
    approved: body.approved === true,
  };
}

/**
 * Map a `/api/scan` response to a {@link ScanClaim}.
 *
 * @param status - HTTP status code
 * @param body - Parsed JSON body, or null when it was not JSON
 * @returns `allowed` with the result on 2xx, `upgrade` on 402, otherwise a readable `error`
 */
export function parseScanClaim(status: number, body: unknown): ScanClaim {
  const fields = isRecord(body) ? body : {};
  if (status >= 200 && status < 300) {
    const result = parseScanResult(body);
    if (!result) return { status: 'error', message: GENERIC_ERROR };
    const remaining = typeof fields.remaining === 'number' ? fields.remaining : -1;
    return { status: 'allowed', remaining, result };
  }
  if (status === HTTP_PAYMENT_REQUIRED) {
    const message = typeof fields.error === 'string' && fields.error ? fields.error : UPGRADE_MESSAGE;
    return { status: 'upgrade', message };
  }
  if (status === HTTP_UNAUTHORIZED) {
    return { status: 'error', message: SIGNED_OUT_ERROR };
  }
  if (status === HTTP_NOT_FOUND) {
    return { status: 'error', message: NOT_FOUND_MESSAGE };
  }
  return { status: 'error', message: GENERIC_ERROR };
}

/**
 * POST once to `/scan` with the current CSRF token.
 *
 * @returns Status and parsed body (null when the body is not JSON)
 * @throws On a network failure
 */
async function postScan({ backendURL, getCsrfToken, fetchImpl = fetch }: ClaimScanOptions, target: ScanTarget) {
  const csrfToken = getCsrfToken();
  const response = await fetchImpl(`${backendURL}/scan`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    body: JSON.stringify(target),
  });
  const body: unknown = await response.json().catch(() => null);
  return { status: response.status, body };
}

/**
 * Scan one product through the backend.
 *
 * A 403 is retried once: the backend answers a stale CSRF token with a fresh
 * cookie, so the second attempt carries a valid one.
 *
 * @param options - Backend URL, CSRF reader, and optional fetch stub
 * @param target - Barcode or search to scan
 * @returns The scan outcome; never throws
 */
export async function claimScan(options: ClaimScanOptions, target: ScanTarget): Promise<ScanClaim> {
  try {
    let result = await postScan(options, target);
    if (result.status === HTTP_FORBIDDEN) {
      result = await postScan(options, target);
    }
    return parseScanClaim(result.status, result.body);
  } catch (error) {
    console.error('Scan failed:', error);
    return { status: 'error', message: GENERIC_ERROR };
  }
}
