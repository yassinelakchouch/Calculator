import { expect, test } from '@playwright/test';

test('the page answers with its name', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/calc-project001/);
});

test('scrollbars are thin and dark, not the browser’s light default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scrollbar-width', 'thin');
  await expect(page.locator('html')).toHaveCSS('scrollbar-color', 'rgb(42, 45, 48) rgba(0, 0, 0, 0)');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
});

test('before any stylesheet arrives the first paint is the dark ground; once styled the page shows (#12)', async ({ page }) => {
  await page.route((url) => url.pathname.endsWith('/src/main.ts'), (route) => route.abort());
  await page.goto('/');
  const bare = await page.evaluate(() => ({ ground: getComputedStyle(document.documentElement).backgroundColor, body: getComputedStyle(document.body).visibility }));
  expect(bare).toEqual({ ground: 'rgb(11, 12, 13)', body: 'hidden' });
  await page.unrouteAll();
  await page.reload();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('visible');
});
