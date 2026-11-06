import { expect, test } from '@playwright/test';

// Machines that ask for reduced motion (this one does) would skip the opening: these flows ask for motion.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

test('the first load rolls 1 to 9 and 0 into the display, each key pressing down as it lands, then rests at 0 with nothing scored (board C-04)', async ({ page }) => {
  // Paused before the page loads: the opening starts on load, and a later pause would fast-forward through it.
  await page.clock.install({ time: new Date('2026-11-06T12:00:00') });
  await page.clock.pauseAt(new Date('2026-11-06T12:00:01'));
  await page.goto('/');
  const opening = page.locator('.opening');
  const down = page.locator('.key[data-woken]');
  const xpBefore = await page.locator('#xp-text').textContent();
  await page.clock.runFor(10);
  await expect(opening.locator('.main')).toHaveText('1');
  await expect(down).toHaveCount(1);
  await expect(page.locator('[data-key="1"]')).toHaveAttribute('data-pressed', '');
  await page.clock.runFor(400);
  await expect(opening.locator('.main')).toHaveText('5');
  await expect(down).toHaveCount(5);
  await page.clock.runFor(500);
  await expect(opening.locator('.main')).toHaveText('0');
  await expect(down).toHaveCount(10);
  await page.clock.runFor(100);
  await expect(down).toHaveCount(0);
  await page.clock.runFor(300);
  await expect(opening).toHaveCount(0);
  await expect(page.locator('#main')).toHaveText('0');
  await expect(page.locator('#xp-text')).toHaveText(xpBefore ?? '');
});

test('a key during the opening ends it and is not typed; a reload in the same visit has none', async ({ page }) => {
  // The clock holds the opening open, however slowly the page reaches its load event.
  await page.clock.install({ time: new Date('2026-11-06T12:00:00') });
  await page.clock.pauseAt(new Date('2026-11-06T12:00:01'));
  await page.goto('/');
  await expect(page.locator('.opening')).toHaveCount(1);
  await page.keyboard.press('7');
  await expect(page.locator('.opening')).toHaveCount(0);
  await expect(page.locator('#main')).toHaveText('0');
  await page.keyboard.press('7');
  await expect(page.locator('#main')).toHaveText('7');
  await page.reload();
  await expect(page.locator('.opening')).toHaveCount(0);
});

test('with reduced motion there is no opening', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.opening')).toHaveCount(0);
});

test('a tap on a key ends it without typing, while a link keeps its click', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T12:00:00') });
  await page.clock.pauseAt(new Date('2026-11-06T12:00:01'));
  await page.goto('/');
  await page.locator('[data-key="7"]').click();
  await expect(page.locator('.opening')).toHaveCount(0);
  await expect(page.locator('#main')).toHaveText('0');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.getByRole('link', { name: /First version/ }).click();
  await expect(page).toHaveURL(/legacy\/index\.html$/);
});

