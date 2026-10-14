import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:8766', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: 'node scripts/serve-tests.mjs',
    url: 'http://127.0.0.1:8766/fixture.html',
    reuseExistingServer: !process.env.CI,
  },
});
