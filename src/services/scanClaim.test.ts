import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { claimScan, parseScanClaim, UPGRADE_MESSAGE } from './scanClaim.ts';

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

describe('parseScanClaim', () => {
  it('allows a 200 and keeps the remaining count', () => {
    assert.deepEqual(parseScanClaim(200, { allowed: true, remaining: 3 }), { status: 'allowed', remaining: 3 });
  });

  it('treats a subscriber 200 without a count as unlimited', () => {
    assert.deepEqual(parseScanClaim(200, {}), { status: 'allowed', remaining: -1 });
  });

  it('maps 402 to the upgrade path with the server message', () => {
    assert.deepEqual(parseScanClaim(402, { error: 'Upgrade now' }), { status: 'upgrade', message: 'Upgrade now' });
  });

  it('falls back to the default upgrade message on a bare 402', () => {
    assert.deepEqual(parseScanClaim(402, null), { status: 'upgrade', message: UPGRADE_MESSAGE });
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
  it('posts to /scan with the CSRF header', async () => {
    const { fetchImpl, calls } = queuedFetch([{ status: 200, body: { remaining: 1 } }]);
    await claimScan({ backendURL: '/api', getCsrfToken: () => 'tok', fetchImpl });
    assert.deepEqual(
      { url: calls[0]?.url, method: calls[0]?.init?.method, headers: calls[0]?.init?.headers },
      { url: '/api/scan', method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' } },
    );
  });

  it('returns the upgrade path when the server answers 402', async () => {
    const { fetchImpl } = queuedFetch([{ status: 402, body: { error: UPGRADE_MESSAGE } }]);
    const claim = await claimScan({ backendURL: '/api', getCsrfToken: () => 'tok', fetchImpl });
    assert.deepEqual(claim, { status: 'upgrade', message: UPGRADE_MESSAGE });
  });

  it('retries once after a 403 with a fresh token', async () => {
    const tokens = ['stale', 'fresh'];
    const { fetchImpl, calls } = queuedFetch([
      { status: 403, body: { error: 'Invalid CSRF token' } },
      { status: 200, body: { remaining: 2 } },
    ]);
    const claim = await claimScan({ backendURL: '/api', getCsrfToken: () => tokens.shift() ?? null, fetchImpl });
    assert.deepEqual({ claim, sent: calls.length }, { claim: { status: 'allowed', remaining: 2 }, sent: 2 });
  });

  it('turns a network failure into a readable error', async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    const claim = await claimScan({ backendURL: '/api', getCsrfToken: () => null, fetchImpl });
    assert.equal(claim.status, 'error');
  });
});
