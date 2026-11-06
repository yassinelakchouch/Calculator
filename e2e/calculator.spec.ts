import { expect, test, type Page } from '@playwright/test';

// The opening (board C-04) plays once per visit; these flows start after it, as a returning visit does.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('calc-project001:opened', '1'));
});

const main = (page: Page) => page.locator('#main');
const display = (page: Page) => page.locator('#display');
const key = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const tap = async (page: Page, ...names: string[]) => {
  for (const name of names) await key(page, name).click();
};
const sum = async (page: Page, typed: string) => {
  await page.keyboard.type(typed);
  await page.keyboard.press('Enter');
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('7 × 8 = shows 56 and earns the first XP', async ({ page }) => {
  await tap(page, '7', 'Multiply', '8', 'Equals');
  await expect(main(page)).toHaveText('56');
  await expect(page.locator('#expression')).toHaveText('7 × 8 =');
  await expect(page.locator('#note')).toHaveText('+1 XP');
  await expect(page.locator('#xp-text')).toHaveText('1/100 XP');
});

test('after clicking keys, Enter on the keyboard still means =', async ({ page }) => {
  await tap(page, '7', 'Multiply');
  await page.keyboard.type('8');
  await page.keyboard.press('Enter');
  await expect(main(page)).toHaveText('56');
});

test('dividing by zero explains itself, and ⌫ takes the 0 back', async ({ page }) => {
  await sum(page, '8/0');
  await expect(page.locator('#error')).toHaveText('! Can’t divide by zero. Your number is kept.');
  await page.keyboard.press('Backspace');
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator('#expression')).toHaveText('8 ÷');
});

test('a second result within 10 s builds a combo', async ({ page }) => {
  await sum(page, '1+1');
  await sum(page, '+2');
  await expect(page.locator('#note')).toHaveText('+2 XP · ×2 combo');
  await expect(page.locator('#combo')).toHaveText('×2 combo');
});

test('XP, badges and the sound setting survive a reload', async ({ page }) => {
  await sum(page, '2+2');
  await page.getByRole('button', { name: 'Sound on' }).click();
  await page.reload();
  await expect(page.locator('#xp-text')).toHaveText('1/100 XP');
  await expect(page.locator('#stats')).toHaveText('1 of 4 badges · best run 0');
  await expect(page.getByRole('button', { name: 'Sound off' })).toBeVisible();
});

test('the first result drops a badge in', async ({ page }) => {
  await sum(page, '2+2');
  await expect(page.locator('#toast')).toContainText('Badge · First result');
});

test('the tape keeps the last three results, newest first', async ({ page }) => {
  for (const typed of ['1+1', '2+2', '3+3', '4+4']) await sum(page, typed);
  await page.getByRole('button', { name: 'Tape' }).click();
  await expect(page.locator('.tape-row')).toHaveCount(3);
  await expect(page.locator('.tape-row').first()).toContainText('4 + 4 = 8');
});

test.describe('the idle runner', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
  });

  test('15 s idle turns the display into the runner, keeping the number', async ({ page }) => {
    await sum(page, '7*8');
    await page.clock.fastForward(15_500);
    await expect(display(page)).toHaveAttribute('data-mode', 'attract');
    await expect(page.locator('#game-text')).toContainText('Idle? Run for it.');
    await expect(page.locator('#run-hint')).toHaveText('56 kept');
  });

  test('any calculator key goes back to the sum and is applied', async ({ page }) => {
    await sum(page, '7*8');
    await page.clock.fastForward(15_500);
    await key(page, '4').click();
    await expect(display(page)).toHaveAttribute('data-mode', 'calc');
    await expect(main(page)).toHaveText('4');
    await expect(page.locator('#back-note')).toHaveClass(/back-in/);
  });

  test('Space starts a run; Esc goes back with nothing typed', async ({ page }) => {
    await page.clock.fastForward(15_500);
    await page.keyboard.press('Space');
    await expect(display(page)).toHaveAttribute('data-mode', 'play');
    await page.keyboard.press('Escape');
    await expect(display(page)).toHaveAttribute('data-mode', 'calc');
    await expect(main(page)).toHaveText('0');
  });

  test('a tap on the screen starts a run', async ({ page }) => {
    await page.clock.fastForward(15_500);
    await display(page).click();
    await expect(display(page)).toHaveAttribute('data-mode', 'play');
  });

  test('a run that never jumps ends on the first obstacle and keeps its score', async ({ page }) => {
    await page.clock.fastForward(15_500);
    await page.keyboard.press('ArrowUp');
    await page.clock.runFor(4_000);
    await expect(display(page)).toHaveAttribute('data-mode', 'over');
    await expect(page.locator('#game-text')).toContainText('best');
  });
});

test('on a phone nothing scrolls sideways and every key is at least 44 px', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const name of ['7', 'Equals', 'All clear']) expect((await key(page, name).boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
