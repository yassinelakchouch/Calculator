import { expect, test } from '@playwright/test';

// Machines that ask for reduced motion (this one does) would skip the loader: these flows ask for motion.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

test('the first load drops the ten digits into a keypad before the page, then hands over to the calculator at 0 with nothing scored (board C-04)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loader')).toBeVisible();
  await expect(page.locator('#loader .loader-fall')).toHaveText(['7', '8', '9', '4', '5', '6', '1', '2', '3', '0']);
  const xpBefore = await page.locator('#xp-text').textContent();
  await expect(page.locator('#loader')).toHaveCount(0, { timeout: 4000 });
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.locator('#main')).toHaveText('0');
  await expect(page.locator('#xp-text')).toHaveText(xpBefore ?? '');
});

test('a key during the loader ends it and is not typed; a reload in the same visit has none', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loader')).toBeVisible();
  await page.keyboard.press('7');
  await expect(page.locator('#loader')).toHaveCount(0);
  await expect(page.locator('#main')).toHaveText('0');
  await page.keyboard.press('7');
  await expect(page.locator('#main')).toHaveText('7');
  await page.reload();
  await expect(page.locator('#loader')).toHaveCount(0);
});

test('a tap on the loader ends it and types nothing', async ({ page }) => {
  // It lasts about 1.5 s: tap as soon as it shows, not after the page's full load.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loader')).toBeVisible();
  const { width, height } = page.viewportSize()!;
  await page.mouse.click(width / 2, height / 2);
  await expect(page.locator('#loader')).toHaveCount(0);
  await expect(page.locator('#main')).toHaveText('0');
});

test('with reduced motion there is no loader', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#loader')).toBeHidden();
  await expect(page.locator('#main')).toBeVisible();
});
