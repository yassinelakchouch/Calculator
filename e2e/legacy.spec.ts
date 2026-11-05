import { expect, test } from '@playwright/test';

test('the first version still works at legacy/index.html, with every file found and no script error', async ({ page }) => {
  const problems: string[] = [];
  page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/legacy/index.html');
  await expect(page).toHaveTitle(/Mycalculator/);
  await page.waitForLoadState('networkidle');
  expect(problems).toEqual([]);
});
