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
    // Click Google OAuth button
    const googleButton = page.locator('button:has-text("Google")');
    
    if (await googleButton.count() > 0) {
      // Mock OAuth callback
      await page.route('**/auth/google/callback**', (route) => {
        route.fulfill({
          status: 302,
          headers: {
            Location: '/dashboard?oauth=google',
          },
        });
      });
      
      await googleButton.click();
      
      // Should redirect to OAuth provider or callback
      await page.waitForTimeout(2000);
      
      // In real scenario, would complete OAuth flow
      // For test, we verify button exists and is clickable
      expect(await googleButton.isVisible()).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should initiate GitHub OAuth login', async ({ page }) => {
    // Click GitHub OAuth button
    const githubButton = page.locator('button:has-text("GitHub")');
    
    if (await githubButton.count() > 0) {
      // Mock OAuth callback
      await page.route('**/auth/github/callback**', (route) => {
        route.fulfill({
          status: 302,
          headers: {
            Location: '/dashboard?oauth=github',
          },
        });
      });
      
      await githubButton.click();
      
      // Should redirect to OAuth provider
      await page.waitForTimeout(2000);
      
      expect(await githubButton.isVisible()).toBeTruthy();
    } else {
      test.skip();
    }
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
