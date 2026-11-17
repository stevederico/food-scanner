
export type IngredientColor = 'red' | 'yellow' | 'green';

export interface RatedIngredient {
  text: string;
  color: IngredientColor | null;
}

export interface ScannedProduct {
  code: string;
  product_name: string;
  image_url: string;
}

export interface ScanResult {
  product: ScannedProduct;
  ingredients: RatedIngredient[];
  approved: boolean;
}

export type ScanTarget = { code: string } | { query: string };

export type ScanClaim =
  | { status: 'allowed'; remaining: number; result: ScanResult }
  | { status: 'upgrade'; message: string }
  | { status: 'error'; message: string };

export interface ClaimScanOptions {
  backendURL: string;
  getCsrfToken: () => string | null;
  fetchImpl?: typeof fetch;
}

export const UPGRADE_MESSAGE = 'Upgrade to the Monthly Plan for unlimited food scans';

export const NOT_FOUND_MESSAGE = 'Product not found. Try another barcode or name.';

const GENERIC_ERROR = 'Could not finish the scan. Check your connection and try again.';
const SIGNED_OUT_ERROR = 'Your session ended. Sign in again to keep scanning.';
const HTTP_PAYMENT_REQUIRED = 402;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const COLORS: readonly string[] = ['red', 'yellow', 'green'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isColor = (value: unknown): value is IngredientColor =>
  typeof value === 'string' && COLORS.includes(value);

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

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
  const body = await readJson(response);
  return { status: response.status, body };
}

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

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
