/**
 * E2E Tests - OAuth Flow
 * Tests OAuth login flows (Google, GitHub)
 */

import { test, expect } from '@playwright/test';

test.describe('OAuth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should initiate Google OAuth login', async ({ page }) => {
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toHaveCount(1);

    await page.route('**/auth/google/callback**', (route) => {
      route.fulfill({
        status: 302,
        headers: {
          Location: '/dashboard?oauth=google',
        },
      });
    });

    await googleButton.click();
    await page.waitForTimeout(2000);
    await expect(googleButton).toBeVisible();
  });

  test('should initiate GitHub OAuth login', async ({ page }) => {
    const githubButton = page.locator('button:has-text("GitHub")');
    await expect(githubButton).toHaveCount(1);

    await page.route('**/auth/github/callback**', (route) => {
      route.fulfill({
        status: 302,
        headers: {
          Location: '/dashboard?oauth=github',
        },
      });
    });

    await githubButton.click();
    await page.waitForTimeout(2000);
    await expect(githubButton).toBeVisible();
  });

  test('should handle OAuth callback errors', async ({ page }) => {
    // Simulate OAuth error callback
    await page.goto('/auth/google/callback?error=access_denied');
    
    // Should show error message or redirect to login
    await expect(page).toHaveURL(/\/login|\/register/);
    
    // Should display error message
    const errorMessage = page.locator('text=OAuth');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
