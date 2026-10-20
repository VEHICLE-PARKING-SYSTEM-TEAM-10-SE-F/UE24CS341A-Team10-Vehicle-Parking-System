// NFR-06 / TC-USAB-01 (automated part): recording a vehicle entry takes at most 5 user
// actions and less than 60 seconds. Every user action below is counted.
// The Test Plan also asks for three first-time users - see docs/test-results/usability.md.
const { test, expect } = require('@playwright/test');
const { prepareCarAndSlot, uiLogin } = require('./helpers');

test('vehicle entry needs at most 5 user actions and under 60 s', async ({ page }, testInfo) => {
  const { regNo } = await prepareCarAndSlot(`U${testInfo.project.name.slice(0, 2)}`);
  await uiLogin(page, 'att1', process.env.SEED_ATTENDANT_PASSWORD);

  let actions = 0;
  const act = async (fn) => { actions += 1; await fn(); };
  const start = Date.now();

  await act(() => page.getByRole('link', { name: 'Entry' }).click()); // 1. open Entry
  await act(() => page.fill('#regNo', regNo)); //                       2. type the registration number
  await act(() => page.getByRole('button', { name: 'Record entry' }).click()); // 3. record
  await expect(page.getByText(/Ticket T-\d{8}-\d+/)).toBeVisible();

  const seconds = (Date.now() - start) / 1000;
  testInfo.annotations.push({ type: 'result', description: `${actions} actions, ${seconds.toFixed(1)} s` });
  expect(actions).toBeLessThanOrEqual(5);
  expect(seconds).toBeLessThan(60);
});
