import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Configuration Playwright pour tests E2E Luneo
 * @see https://playwright.dev/docs/test-configuration
 */

// Chemin pour sauvegarder l'état d'authentification
const STORAGE_STATE = path.join(__dirname, '.playwright', '.auth', 'user.json');

export default defineConfig({
  // Dossier des tests
  testDir: './tests/e2e',
  
  // Exécution parallèle
  fullyParallel: true,
  
  // Interdire test.only en CI
  forbidOnly: !!process.env.CI,
  
  // Retry en cas d'échec
  retries: process.env.CI ? 2 : 1,
  
  // Workers
  workers: process.env.CI ? 1 : 4,
  
  // Timeouts
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  
  // Reporters
  reporter: process.env.CI 
    ? [
        ['list'],
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'playwright-report/results.json' }],
        ['junit', { outputFile: 'playwright-report/junit.xml' }],
      ]
    : [
        ['list'],
        ['html', { open: 'never' }],
      ],
  
  // Configuration globale
  use: {
    // URL de base
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Traces pour débogage
    trace: 'on-first-retry',
    
    // Screenshots uniquement en cas d'échec
    screenshot: 'only-on-failure',
    
    // Vidéo en cas d'échec
    video: 'on-first-retry',
    
    // Viewport par défaut
    viewport: { width: 1280, height: 720 },
    
    // Locale français
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    
    // Ignorer les certificats HTTPS en local
    ignoreHTTPSErrors: true,
    
    // Action timeout
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Projets (navigateurs/devices)
  projects: [
    // Setup : authentification
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Desktop Browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    
    // Mobile
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
    
    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] },
      dependencies: ['setup'],
    },
    
    // Tests authentifiés (utilise l'état sauvegardé)
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
      testMatch: /.*\.authenticated\.spec\.ts/,
    },
  ],

  // Web Server local
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  
  // Dossier de sortie
  outputDir: 'test-results',
  
  // Préserver les outputs en cas d'échec
  preserveOutput: 'failures-only',
  
  // Global setup/teardown
  globalSetup: process.env.CI ? undefined : './tests/e2e/global-setup.ts',
  globalTeardown: process.env.CI ? undefined : './tests/e2e/global-teardown.ts',
});

// Export du chemin du storage state pour les fixtures
export { STORAGE_STATE };
