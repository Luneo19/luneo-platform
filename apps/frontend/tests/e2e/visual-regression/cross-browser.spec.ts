/**
 * Visual Regression Tests - Cross Browser
 * Tests visual consistency across different browsers
 */

import { test, expect } from '@playwright/test';

const browsers = ['chromium', 'firefox', 'webkit'] as const;

test.describe('Visual Regression - Cross Browser', () => {
  for (const browser of browsers) {
    test.describe(`Visual tests on ${browser}`, () => {
      test.use({ browserName: browser });

      test(`should match homepage on ${browser}`, async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`homepage-${browser}.png`, {
          fullPage: true,
          maxDiffPixels: 200, // Higher tolerance for cross-browser
        });
      });

      test(`should match login page on ${browser}`, async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`login-${browser}.png`, {
          fullPage: true,
          maxDiffPixels: 200,
        });
      });

      test(`should match register page on ${browser}`, async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/register');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`register-${browser}.png`, {
          fullPage: true,
          maxDiffPixels: 200,
        });
      });
    });
  }
});
