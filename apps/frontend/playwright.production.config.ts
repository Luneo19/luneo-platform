import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 90000,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'https://luneo.app',
    trace: 'off',
    screenshot: 'on',
    video: 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
