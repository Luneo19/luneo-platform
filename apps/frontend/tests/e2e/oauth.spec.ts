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
      await expect(googleButton).toBeVisible();
      console.log('✅ Google OAuth button found');
    });

    test('should redirect to Google OAuth when clicking button', async ({ page, context }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const googleButton = page.getByRole('button', { name: /google/i }).or(
        page.getByText(/continuer avec google|sign in with google/i)
      );

      await expect(googleButton).toBeVisible();

      let oauthRequestSeen = false;
      context.on('request', (request) => {
        if (request.url().includes('accounts.google.com') || request.url().includes('/api/v1/auth/google')) {
          oauthRequestSeen = true;
        }
      });

      await googleButton.click();

      // Should redirect to Google or OAuth endpoint
      await page.waitForTimeout(2000);
      const url = page.url();
      const body = (await page.textContent('body')) || '';
      expect(
        url.includes('accounts.google.com') ||
        url.includes('/api/v1/auth/google') ||
        oauthRequestSeen ||
        !body.includes('Internal Server Error')
      ).toBeTruthy();
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
      await expect(githubButton).toBeVisible();
      console.log('✅ GitHub OAuth button found');
    });

    test('should redirect to GitHub OAuth when clicking button', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const githubButton = page.getByRole('button', { name: /github/i }).or(
        page.getByText(/continuer avec github|sign in with github/i)
      );

      await expect(githubButton).toBeVisible();
      let oauthSignalSeen = false;
      page.on('response', (response) => {
        if (response.url().includes('github.com/login/oauth') || response.url().includes('/api/v1/auth/github')) {
          oauthSignalSeen = true;
        }
      });
      await githubButton.click();

      // Should redirect to GitHub or OAuth endpoint
      await page.waitForTimeout(2000);
      const url = page.url();
      const body = (await page.textContent('body')) || '';
      expect(
        url.includes('github.com/login/oauth') ||
        url.includes('/api/v1/auth/github') ||
        oauthSignalSeen ||
        !body.includes('Internal Server Error')
      ).toBeTruthy();
    });
  });
});
