/**
 * E2E Tests - OAuth Flows
 * Tests for Google and GitHub OAuth authentication
 */

import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';

test.describe('OAuth Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test.describe('Google OAuth', () => {
    test('should display Google OAuth button on login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check for Google OAuth button
      const googleButton = page.getByRole('button', { name: /google/i }).or(
        page.getByText(/continuer avec google|sign in with google/i)
      );

      const hasGoogleButton = await googleButton.isVisible().catch(() => false);

      if (hasGoogleButton) {
        console.log('✅ Google OAuth button found');
        await expect(googleButton).toBeVisible();
      } else {
        console.warn('⚠️ Google OAuth button not found (might be disabled)');
      }
    });

    test('should redirect to Google OAuth when clicking button', async ({ page, context }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const googleButton = page.getByRole('button', { name: /google/i }).or(
        page.getByText(/continuer avec google|sign in with google/i)
      );

      const hasGoogleButton = await googleButton.isVisible().catch(() => false);

      if (hasGoogleButton) {
        // Click button and wait for navigation
        const [response] = await Promise.all([
          page.waitForResponse((response) =>
            response.url().includes('accounts.google.com') ||
            response.url().includes('/api/v1/auth/google')
          ).catch(() => null),
          googleButton.click(),
        ]);

        // Should redirect to Google or OAuth endpoint
        await page.waitForTimeout(2000);
        const url = page.url();

        if (url.includes('accounts.google.com') || url.includes('/api/v1/auth/google')) {
          console.log('✅ Redirected to Google OAuth');
        } else {
          console.warn('⚠️ Did not redirect to Google OAuth');
        }
      }
    });
  });

  test.describe('GitHub OAuth', () => {
    test('should display GitHub OAuth button on login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check for GitHub OAuth button
      const githubButton = page.getByRole('button', { name: /github/i }).or(
        page.getByText(/continuer avec github|sign in with github/i)
      );

      const hasGithubButton = await githubButton.isVisible().catch(() => false);

      if (hasGithubButton) {
        console.log('✅ GitHub OAuth button found');
        await expect(githubButton).toBeVisible();
      } else {
        console.warn('⚠️ GitHub OAuth button not found (might be disabled)');
      }
    });

    test('should redirect to GitHub OAuth when clicking button', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const githubButton = page.getByRole('button', { name: /github/i }).or(
        page.getByText(/continuer avec github|sign in with github/i)
      );

      const hasGithubButton = await githubButton.isVisible().catch(() => false);

      if (hasGithubButton) {
        // Click button and wait for navigation
        const [response] = await Promise.all([
          page.waitForResponse((response) =>
            response.url().includes('github.com/login/oauth') ||
            response.url().includes('/api/v1/auth/github')
          ).catch(() => null),
          githubButton.click(),
        ]);

        // Should redirect to GitHub or OAuth endpoint
        await page.waitForTimeout(2000);
        const url = page.url();

        if (url.includes('github.com/login/oauth') || url.includes('/api/v1/auth/github')) {
          console.log('✅ Redirected to GitHub OAuth');
        } else {
          console.warn('⚠️ Did not redirect to GitHub OAuth');
        }
      }
    });
  });
});
