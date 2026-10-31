import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { claimScan, parseScanClaim, parseScanResult, NOT_FOUND_MESSAGE, UPGRADE_MESSAGE } from './scanClaim.ts';

/** A fetch stub that answers each call with the next queued status and body. */
function queuedFetch(replies: Array<{ status: number; body: unknown }>) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    const reply = replies.shift() ?? { status: 500, body: null };
    return new Response(JSON.stringify(reply.body), { status: reply.status });
  };
  return { fetchImpl, calls };
}

/** A server 200 body for one product. */
const SCANNED = {
  allowed: true,
  remaining: 3,
  product: { code: '123', product_name: 'Spread', image_url: 'https://img.example.com/a.jpg' },
  ingredients: [{ text: 'Ace-K', color: 'red' }, { text: 'water', color: null }],
  approved: false,
};

const RESULT = {
  product: { code: '123', product_name: 'Spread', image_url: 'https://img.example.com/a.jpg' },
  ingredients: [{ text: 'Ace-K', color: 'red' }, { text: 'water', color: null }],
  approved: false,
};

describe('parseScanResult', () => {
  it('reads the product, rated ingredients and verdict', () => {
    assert.deepEqual(parseScanResult(SCANNED), RESULT);
  });

  it('drops unknown colors and blank ingredients', () => {
    const result = parseScanResult({ product: {}, ingredients: [{ text: 'x', color: 'blue' }, { text: '' }], approved: true });
    assert.deepEqual(result?.ingredients, [{ text: 'x', color: null }]);
  });

  it('returns null without a product', () => {
    assert.equal(parseScanResult({ allowed: true }), null);
  });
});

describe('parseScanClaim', () => {
  it('allows a 200 and keeps the remaining count and result', () => {
    assert.deepEqual(parseScanClaim(200, SCANNED), { status: 'allowed', remaining: 3, result: RESULT });
  });

  it('treats a subscriber 200 without a count as unlimited', () => {
    const claim = parseScanClaim(200, { ...SCANNED, remaining: undefined });
    assert.ok(claim.status === 'allowed' && claim.remaining === -1);
  });

  it('refuses a 200 that carries no product', () => {
    assert.equal(parseScanClaim(200, { allowed: true }).status, 'error');
  });

  it('maps 402 to the upgrade path with the server message', () => {
    assert.deepEqual(parseScanClaim(402, { error: 'Upgrade now' }), { status: 'upgrade', message: 'Upgrade now' });
  });

  it('falls back to the default upgrade message on a bare 402', () => {
    assert.deepEqual(parseScanClaim(402, null), { status: 'upgrade', message: UPGRADE_MESSAGE });
  });

  it('says the product was not found on 404', () => {
    assert.deepEqual(parseScanClaim(404, { error: 'Product not found' }), { status: 'error', message: NOT_FOUND_MESSAGE });
  });

  it('asks a signed-out user to sign in again on 401', () => {
    const claim = parseScanClaim(401, null);
    assert.ok(claim.status === 'error' && /Sign in/.test(claim.message));
  });

  it('never surfaces a raw server error on 500', () => {
    const claim = parseScanClaim(500, { error: 'database is locked' });
    assert.ok(claim.status === 'error' && !claim.message.includes('database'));
  });
});

describe('claimScan', () => {
  it('posts the target to /scan with the CSRF header', async () => {
    const { fetchImpl, calls } = queuedFetch([{ status: 200, body: SCANNED }]);
    await claimScan({ backendURL: '/api', getCsrfToken: () => 'tok', fetchImpl }, { code: '123' });
    assert.deepEqual(
      { url: calls[0]?.url, method: calls[0]?.init?.method, headers: calls[0]?.init?.headers, body: calls[0]?.init?.body },
      {
        url: '/api/scan',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
        body: '{"code":"123"}',
      },
    );
  });

  it('sends a name search as a query', async () => {
    const { fetchImpl, calls } = queuedFetch([{ status: 200, body: SCANNED }]);
    await claimScan({ backendURL: '/api', getCsrfToken: () => 'tok', fetchImpl }, { query: 'peanut butter' });
    assert.equal(calls[0]?.init?.body, '{"query":"peanut butter"}');
  });

  it('only calls the backend, never Open Food Facts', async () => {
    const { fetchImpl, calls } = queuedFetch([{ status: 200, body: SCANNED }]);
    await claimScan({ backendURL: '/api', getCsrfToken: () => 'tok', fetchImpl }, { code: '123' });
    assert.deepEqual(calls.map((c) => c.url), ['/api/scan']);
  });

  it('returns the upgrade path when the server answers 402', async () => {
    const { fetchImpl } = queuedFetch([{ status: 402, body: { error: UPGRADE_MESSAGE } }]);
    const claim = await claimScan({ backendURL: '/api', getCsrfToken: () => 'tok', fetchImpl }, { code: '123' });
    assert.deepEqual(claim, { status: 'upgrade', message: UPGRADE_MESSAGE });
  });

  it('retries once after a 403 with a fresh token', async () => {
    const tokens = ['stale', 'fresh'];
    const { fetchImpl, calls } = queuedFetch([
      { status: 403, body: { error: 'Invalid CSRF token' } },
      { status: 200, body: { ...SCANNED, remaining: 2 } },
    ]);
    const claim = await claimScan(
      { backendURL: '/api', getCsrfToken: () => tokens.shift() ?? null, fetchImpl },
      { code: '123' },
    );
    assert.deepEqual(
      { status: claim.status, remaining: claim.status === 'allowed' ? claim.remaining : null, sent: calls.length },
      { status: 'allowed', remaining: 2, sent: 2 },
    );
  });

  it('turns a network failure into a readable error', async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    const claim = await claimScan({ backendURL: '/api', getCsrfToken: () => null, fetchImpl }, { code: '123' });
    assert.equal(claim.status, 'error');
  });
});
