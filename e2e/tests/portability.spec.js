// NFR-07 / TC-PORT-01: the smoke suite (login, slot view, entry, exit) passes in each browser,
// and at 360, 768 and 1366 px wide nothing overflows the page horizontally.
const { test, expect } = require('@playwright/test');
const { prepareCarAndSlot, uiLogin, expectNoHorizontalScroll } = require('./helpers');

for (const width of [360, 768, 1366]) {
  test(`smoke suite at ${width} px wide`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 600 ? 780 : 900 });
    const { regNo } = await prepareCarAndSlot(`${testInfo.project.name.slice(0, 2)}${width}`);

    await page.goto('/login');
    await expectNoHorizontalScroll(page);
    await uiLogin(page, 'att1', process.env.SEED_ATTENDANT_PASSWORD);

    // Slot view
    await expect(page.getByRole('heading', { name: 'Slot availability' })).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Entry
    await page.getByRole('link', { name: 'Entry' }).click();
    await page.fill('#regNo', regNo);
    await page.getByRole('button', { name: 'Record entry' }).click();
    await expect(page.getByText(/Ticket T-\d{8}-\d+/)).toBeVisible();
    await expectNoHorizontalScroll(page);

    // Exit with fee summary and confirmation
    await page.getByRole('link', { name: 'Exit' }).click();
    await page.fill('#regNo', regNo);
    await page.getByRole('button', { name: 'Record exit' }).click();
    await expect(page.getByText('Fee summary – please confirm')).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'Confirm exit' }).click();
    await expect(page.getByText(/Exit complete/)).toBeVisible();

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  });
}
