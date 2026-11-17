import { after, afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { REPO, SCREENSHOTS } from './paths.js';
import { BACKEND_API_URL, BACKEND_BOOT_TIMEOUT_MS, FRONTEND_PORT, FRONTEND_URL, assertPortsFree, resetArtifacts, startServers, stopServers } from './servers.js';
import { ab, attribute, click, cookieHeader, drainProblems, expectGone, expectNoText, expectText, expectUrl, fill, findRole, labelledByText, writeBrowserConfig } from './browser.js';

const constants = JSON.parse(readFileSync(path.join(REPO, 'src/constants.json'), 'utf8'));
const PAGE_TITLES = constants.pages.map((item) => item.title);

const BACKEND_API = BACKEND_API_URL;
const USER = { name: 'Verify User', email: `verify-${Date.now()}@example.com`, password: 'verify-pass-1' };
const VIEWPORT = ['1280', '720'];
const RECENT_SCAN = {
  id: '3017620422003',
  name: 'Verify Spread',
  image: '',
  timestamp: 1,
  result: {
    product: { code: '3017620422003', product_name: 'Verify Spread', image_url: '' },
    ingredients: [{ text: 'sugar', color: 'green' }],
    approved: true,
  },
};
const SETUP_TIMEOUT_MS = BACKEND_BOOT_TIMEOUT_MS + 120_000;
const FLOW_TIMEOUT_MS = 90_000;

const ALLOWED_FAILED_REQUESTS = [
  { status: 404, url: /\/api\/signup\/options$/ },
  { status: 401, url: /\/api\/signin$/ },
];

const MAIN = { role: 'main' };
const BANNER = { role: 'banner' };
const FOOTER = { role: 'contentinfo' };
const authDialog = (mode) => ({ role: 'dialog', name: mode });
const button = (name) => ({ role: 'button', name });
const heading = (name, level) => ({ role: 'heading', name, level });

let servers = [];
let hasFailed = false;
const problems = [];

const goto = (route) => ab('open', `${FRONTEND_URL}${route}`);

const shot = (name) => ab('screenshot', '--full', path.join(SCREENSHOTS, `${name}.png`));

async function backendMe() {
  const response = await fetch(`${BACKEND_API}/me`, { headers: { cookie: await cookieHeader(new URL(BACKEND_API).hostname) } });
  return { status: response.status, body: response.ok ? await response.json() : null };
}

function flow(name, body) {
  it(name, { timeout: FLOW_TIMEOUT_MS }, async (t) => {
    if (hasFailed) return t.skip('an earlier flow failed; the flows share one browser session');
    try {
      await body();
    } catch (error) {
      hasFailed = true;
      throw error;
    }
  });
}

describe('runtime verify', () => {
  before(async () => {
    await assertPortsFree();
    resetArtifacts();
    writeBrowserConfig();
    servers = await startServers();
    await ab('open');
    await ab('set', 'viewport', ...VIEWPORT);
    await ab('set', 'media', 'light', 'reduced-motion');
  }, { timeout: SETUP_TIMEOUT_MS });

  afterEach(async () => {
    problems.push(...(await drainProblems(ALLOWED_FAILED_REQUESTS)));
  });

  after(async () => {
    try {
      await ab('close');
    } catch (error) {
      console.error(`agent-browser close failed: ${error.message}`);
    }
    stopServers(servers);
  });

  flow('landing page shows the product, features, pricing and legal links', async () => {
    await goto('/');
    await findRole(heading(constants.tagline, 1));
    await findRole({ role: 'link', name: constants.appName }, { within: BANNER });
    await findRole(heading(constants.features.title));
    await findRole(heading(constants.pricing.title));
    assert.equal(await attribute({ role: 'link', name: 'Terms' }, 'href', { within: FOOTER }), '/terms');
    await shot('01-landing');
  });

  flow('call to action opens the app for a guest, and settings asks them to sign in', async () => {
    await click(button(constants.cta), { within: BANNER });
    await expectUrl(/\/app\/home$/);
    await findRole(heading('Welcome', 1), { within: MAIN });
    await click(button('Settings'));
    await expectText('Sign in to access your account settings.', { within: MAIN });
    await shot('02-guest-settings');
  });

  flow('sign up creates an account and a backend session', async () => {
    await goto('/signup');
    const dialog = authDialog('Sign Up');
    await findRole(dialog);
    await fill({ role: 'textbox', name: 'Name' }, USER.name, { within: dialog });
    await fill({ role: 'textbox', name: 'Email' }, USER.email, { within: dialog });
    await fill({ role: 'textbox', name: 'Password' }, USER.password, { within: dialog });
    await click(button('Sign Up'), { within: dialog });
    await expectGone(dialog);
    const me = await backendMe();
    assert.equal(me.status, 200, 'backend session cookie is set after sign up');
    assert.equal(me.body.email, USER.email);
  });

  flow('home shows search, the scan call to action, an empty recent list and the ingredient guide', async () => {
    await goto('/app/home');
    await findRole(heading('Welcome', 1), { within: MAIN });
    await findRole(heading(/^find a product$/i, 2), { within: MAIN });
    await findRole({ role: 'textbox', name: 'Search products by name or barcode' }, { within: MAIN });
    await findRole(button('Search'), { within: MAIN });
    await findRole(button(/^Scan Product/), { within: MAIN });
    await expectText('No recent scans yet', { within: MAIN });
    await findRole(heading(/^ingredients guide$/i, 2), { within: MAIN });
    for (const label of ['Safe', 'Caution', 'Avoid']) await expectText(label, { within: MAIN, exact: true });
    for (const title of [...PAGE_TITLES, 'Settings']) await findRole(button(title));
    await shot('03-home');
  });

  flow('a stored recent scan opens its product without a lookup', async () => {
    await ab('eval', `localStorage.setItem('recentScans', JSON.stringify([${JSON.stringify(RECENT_SCAN)}]))`);
    await goto('/app/home');
    await click(button(`View ${RECENT_SCAN.name}`), { within: MAIN });
    const dialog = { role: 'dialog', name: RECENT_SCAN.name };
    await findRole(heading(RECENT_SCAN.name), { within: dialog });
    await expectText('Approved', { within: dialog, exact: true });
    await expectText('Sugar', { within: dialog, exact: true });
    await shot('04-product');
    await click(button('Close'), { within: dialog });
    await expectGone(dialog);
    await click(button('View All'), { within: MAIN });
    const list = { role: 'dialog', name: 'Recent Scans' };
    await findRole(button(`View ${RECENT_SCAN.name}`), { within: list });
    await shot('05-recent-scans');
    await click(button('Close'), { within: list });
    await expectGone(list);
    await ab('eval', "localStorage.removeItem('recentScans')");
  });

  flow('sidebar navigates to the docs page', async () => {
    await click(button('Docs'));
    await expectUrl(/\/app\/docs$/);
    await findRole(heading('About Food Scan', 2), { within: MAIN });
    await findRole(heading('Ingredient Color Guide', 2), { within: MAIN });
    await shot('06-docs');
  });

  flow('command menu opens with Ctrl+K and navigates', async () => {
    await ab('press', 'Control+k');
    const menu = { role: 'dialog' };
    await findRole({ role: 'combobox' }, { within: menu });
    assert.equal(await labelledByText(menu), 'Command Menu');
    await shot('07-command-menu');
    await click({ role: 'option', name: 'Home' }, { within: menu });
    await expectUrl(/\/app\/home$/);
    await findRole(heading('Welcome', 1), { within: MAIN });
  });

  flow('settings shows the signed-in account, plan and version', async () => {
    await click(button('Settings'));
    await expectUrl(/\/app\/settings$/);
    await findRole(heading('Settings', 1), { within: MAIN });
    await expectText(USER.email, { within: MAIN });
    await expectText('Free plan', { within: MAIN });
    await expectText(/^v\d+\.\d+\.\d+$/, { within: MAIN });
    await shot('08-settings');
  });

  flow('sign out asks for confirmation and ends the session', async () => {
    await click(button('Sign Out'), { within: MAIN });
    const confirm = { role: 'alertdialog' };
    await expectText('Are you sure you want to sign out?', { within: confirm });
    await click(button('Sign Out'), { within: confirm });
    await expectUrl(new RegExp(`:${FRONTEND_PORT}/$`));
    await findRole(heading(constants.tagline, 1));
    const me = await backendMe();
    assert.equal(me.status, 401, 'backend rejects the session after sign out');
  });

  flow('legal pages render with the company name filled in', async () => {
    await goto('/terms');
    await expectText(`Welcome to the ${constants.companyName} Application.`);
    await expectNoText(/_COMPANY_|_WEBSITE_|_EMAIL_/);
    await shot('09-terms');
    await goto('/privacy');
    await expectText(/governs your use of the software application/);
    await expectNoText(/_COMPANY_|_WEBSITE_|_EMAIL_/);
    await goto('/eula');
    await expectNoText(/_COMPANY_|_WEBSITE_|_EMAIL_/);
  });

  flow('unknown route shows the 404 page', async () => {
    await goto('/this-route-does-not-exist');
    await expectText('404', { exact: true });
    await expectText('Page not found.');
    await shot('10-not-found');
  });

  it('no uncaught exceptions, console errors or unexpected failed requests during the flows', () => {
    assert.deepEqual(problems, []);
  });
});
