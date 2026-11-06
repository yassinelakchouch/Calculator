import type { Page } from '@playwright/test';

// The loader (board C-04) plays once per visit: a returning visit starts after it, and has seen the opening scenes (board C-05).
export const returningVisit = (page: Page) =>
  page.addInitScript(() => {
    sessionStorage.setItem('calc-project001:opened', '1');
    localStorage.setItem('calc-project001:intro', 'seen');
  });

// The opening scenes play once per device: specs about the loader mark them seen, so they end at the calculator as before.
export const skipIntro = (page: Page) => page.addInitScript(() => localStorage.setItem('calc-project001:intro', 'seen'));
