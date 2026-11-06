import type { Page } from '@playwright/test';

// The loader (board C-04) plays once per visit: a returning visit starts after it.
export const returningVisit = (page: Page) => page.addInitScript(() => sessionStorage.setItem('calc-project001:opened', '1'));
