/**
 * Client for `POST /api/scan`, the server-side gate on food scans.
 *
 * Unlimited food scans are the Monthly Plan's paid feature. The backend admits
 * active subscribers, spends one free scan per claim for everyone else, and
 * answers 402 once the free scans are gone. This module turns that answer into
 * a {@link ScanClaim} the views can act on (show the result, or the upgrade
 * path). It takes the backend URL and CSRF reader as arguments so it has no
 * shell imports and runs under `node --test`.
 */

/** Outcome of claiming one scan. */
export type ScanClaim =
  | { status: 'allowed'; remaining: number }
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

const GENERIC_ERROR = 'Could not start the scan. Check your connection and try again.';
const SIGNED_OUT_ERROR = 'Your session ended. Sign in again to keep scanning.';
const HTTP_PAYMENT_REQUIRED = 402;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

/** True for a non-null, non-array object. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Map a `/api/scan` response to a {@link ScanClaim}.
 *
 * @param status - HTTP status code
 * @param body - Parsed JSON body, or null when it was not JSON
 * @returns `allowed` on 2xx, `upgrade` on 402, otherwise a readable `error`
 */
export function parseScanClaim(status: number, body: unknown): ScanClaim {
  const fields = isRecord(body) ? body : {};
  if (status >= 200 && status < 300) {
    const remaining = typeof fields.remaining === 'number' ? fields.remaining : -1;
    return { status: 'allowed', remaining };
  }
  if (status === HTTP_PAYMENT_REQUIRED) {
    const message = typeof fields.error === 'string' && fields.error ? fields.error : UPGRADE_MESSAGE;
    return { status: 'upgrade', message };
  }
  if (status === HTTP_UNAUTHORIZED) {
    return { status: 'error', message: SIGNED_OUT_ERROR };
  }
  return { status: 'error', message: GENERIC_ERROR };
}

/**
 * POST once to `/scan` with the current CSRF token.
 *
 * @returns Status and parsed body (null when the body is not JSON)
 * @throws On a network failure
 */
async function postScan({ backendURL, getCsrfToken, fetchImpl = fetch }: ClaimScanOptions) {
  const csrfToken = getCsrfToken();
  const response = await fetchImpl(`${backendURL}/scan`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    body: '{}',
  });
  const body: unknown = await response.json().catch(() => null);
  return { status: response.status, body };
}

/**
 * Claim one food scan from the backend.
 *
 * A 403 is retried once: the backend answers a stale CSRF token with a fresh
 * cookie, so the second attempt carries a valid one.
 *
 * @param options - Backend URL, CSRF reader, and optional fetch stub
 * @returns The claim outcome; never throws
 */
export async function claimScan(options: ClaimScanOptions): Promise<ScanClaim> {
  try {
    let result = await postScan(options);
    if (result.status === HTTP_FORBIDDEN) {
      result = await postScan(options);
    }
    return parseScanClaim(result.status, result.body);
  } catch (error) {
    console.error('Scan claim failed:', error);
    return { status: 'error', message: GENERIC_ERROR };
  }
}
