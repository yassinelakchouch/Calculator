import { expect, test } from '@playwright/test';

test('the page answers with its name', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/calc-project001/);
});
