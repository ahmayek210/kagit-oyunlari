const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html')).sort();
test('catalog contains 19 game pages', () => {
  expect(files.filter(f => f !== 'index.html')).toHaveLength(19);
});
for (const file of files) {
  test(`${file} serves a usable document shell`, async ({ page }) => {
    // Smoke tests must not create accounts or touch the production backend.
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    const response = await page.goto('/' + file);
    expect(response.status()).toBe(200);
    await expect(page).toHaveTitle(/Kâğıtlık/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('button').first()).toBeAttached();
  });
}
