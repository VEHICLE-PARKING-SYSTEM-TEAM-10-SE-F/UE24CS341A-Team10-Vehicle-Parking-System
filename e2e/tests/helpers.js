// Shared steps. Test data is created through the API with a unique suffix per run.
const { expect } = require('@playwright/test');

const API = `${process.env.E2E_API_URL || 'http://localhost:5000'}/api/v1`;

async function apiLogin(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`API login failed for ${username} (${res.status}). Run npm run seed in server/.`);
  return (await res.json()).token;
}

async function apiPost(token, path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// A Car slot and a registered Car, unique to this test run.
async function prepareCarAndSlot(tag) {
  const admin = await apiLogin('admin1', process.env.SEED_ADMIN_PASSWORD);
  const suffix = `${tag}${Date.now().toString(36).slice(-4)}`.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-8);
  const slotId = `E${suffix}`.slice(0, 12);
  const regNo = `KA${suffix}`.slice(0, 15);
  const s = await apiPost(admin, '/slots', { slotId, slotType: 'CAR' });
  const v = await apiPost(admin, '/vehicles', { regNo, vehicleType: 'CAR' });
  if (s.status !== 201 || v.status !== 201) throw new Error(`test data setup failed: ${s.status} ${v.status}`);
  return { slotId, regNo };
}

async function uiLogin(page, username, password) {
  await page.goto('/login');
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
}

// NFR-07: no horizontal scrolling of the page itself.
async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'page is wider than the screen').toBeLessThanOrEqual(1);
}

module.exports = { apiLogin, apiPost, prepareCarAndSlot, uiLogin, expectNoHorizontalScroll };
