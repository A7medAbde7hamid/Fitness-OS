import { defineConfig } from '@playwright/test';

const STAGING_URL = process.env.STAGING_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: STAGING_URL,
    headless: true,
    viewport: { width: 375, height: 812 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
  projects: [
    {
      name: 'staging-chromium',
      use: { browserName: 'chromium' },
    },
  ],
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/staging-results.json' }],
  ],
  // No webServer - staging is already deployed
});
