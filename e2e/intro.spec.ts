import { expect, test, type Page } from '@playwright/test';

// Board C-05: a first visit watches the calculator show itself. The loader is already seen this visit, so the scenes start at once.
const bar = (page: Page) => page.locator('#intro');

test.use({ reducedMotion: 'no-preference' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('calc-project001:opened', '1'));
  await page.goto('/');
});

test('four scenes show a sum, its XP, the wait and a jump, then hand back an untouched calculator', async ({ page }) => {
  await expect(bar(page)).toContainText('How it works · 1/4');
  await expect(page.locator('#main')).toHaveText('8');
  await expect(page.locator('#note')).toContainText('click a key, or type it');
  await expect(bar(page)).toContainText('How it works · 3/4', { timeout: 6000 });
  await expect(page.locator('#display')).toHaveAttribute('data-mode', 'attract');
  await expect(bar(page)).toContainText('How it works · 4/4', { timeout: 4000 });
  await expect(page.locator('#display')).toHaveAttribute('data-mode', 'play');
  await expect(bar(page)).toBeHidden({ timeout: 4000 });
  await expect(page.locator('#display')).toHaveAttribute('data-mode', 'calc');
  await expect(page.locator('#main')).toHaveText('0');
  await expect(page.locator('#xp-text')).toHaveText('0/100 XP');
  await expect(page.locator('#how')).toHaveAttribute('data-ring', '');
});

test('a key during the scenes types at once; the scenes count nothing', async ({ page }) => {
  await expect(bar(page)).toContainText('How it works · 2/4', { timeout: 4000 });
  await page.keyboard.press('9');
  await expect(bar(page)).toBeHidden();
  await expect(page.locator('#main')).toHaveText('9');
  await expect(page.locator('#xp-text')).toHaveText('0/100 XP');
});

test('Esc skips, and the scenes never play by themselves again on this device', async ({ page }) => {
  await expect(bar(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(bar(page)).toBeHidden();
  await expect(page.locator('#main')).toHaveText('0');
  await page.reload();
  await expect(page.locator('#main')).toHaveText('0');
  await expect(bar(page)).toBeHidden();
});

test('How it works brings them back; → steps on and Skip leaves', async ({ page }) => {
  await page.keyboard.press('Escape');
  await expect(bar(page)).toBeHidden();
  await page.getByRole('button', { name: 'How it works' }).click();
  await expect(bar(page)).toContainText('How it works · 1/4');
  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowRight');
  await expect(bar(page)).toContainText('How it works · 2/4');
  await page.getByRole('button', { name: 'Skip · Esc' }).click();
  await expect(bar(page)).toBeHidden();
  await expect(page.locator('#main')).toHaveText('0');
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the same scenes play as stills', async ({ page }) => {
    await expect(bar(page)).toContainText('How it works · 1/4');
    await expect(bar(page)).toContainText('How it works · 2/4', { timeout: 4000 });
    await expect(page.locator('#main')).toHaveText('56');
  });
});
