import { defineConfig, devices } from '@playwright/test';

const PORT = 5180;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  // More parallel browsers starve the owner's machine.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The installed Google Chrome; GitHub's runners ship it too.
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'npm run dev', url: `http://localhost:${PORT}`, reuseExistingServer: !process.env.CI },
});
