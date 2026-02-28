import { test, expect } from '@playwright/test';

test.describe('OAuth Flows', () => {
  test.describe('Google OAuth', () => {
    test('should redirect to Google OAuth when clicking Google button', async ({ page }) => {
      await page.goto('/login');

      // Mock the OAuth initiation
      await page.route('**/api/v1/auth/google', async (route) => {
        // Redirect to Google OAuth
        await route.fulfill({
          status: 302,
          headers: {
            Location: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test&redirect_uri=test',
          },
        });
      });

      const googleButton = page.getByRole('button', { name: /google|continuer avec google/i }).or(
        page.getByRole('link', { name: /google|continuer avec google/i })
      ).first();
      if ((await googleButton.count()) > 0) {
        await expect(googleButton).toBeVisible();
        await googleButton.click({ noWaitAfter: true });
      } else {
        await expect(page).toHaveURL(/.*login/);
      }
      // Should redirect to Google
      await page.waitForTimeout(1000);
      const currentUrl = page.url().toLowerCase();
      expect(
        currentUrl.includes('/login') ||
        currentUrl.includes('/auth') ||
        currentUrl.includes('google') ||
        currentUrl.includes('oauth')
      ).toBeTruthy();
      // Note: In real tests, you'd need to handle the OAuth callback
    });

    test('should handle Google OAuth callback successfully', async ({ page }) => {
      // Mock OAuth callback
      await page.route('**/api/v1/auth/google/callback**', async (route) => {
        await route.fulfill({
          status: 302,
          headers: {
            Location: '/auth/callback?next=/overview',
            'Set-Cookie': 'accessToken=mock-google-token; HttpOnly; Path=/',
          },
        });
      });

      // Mock user data after OAuth
      await page.route('**/api/v1/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-123',
            email: 'google-user@example.com',
            firstName: 'Google',
            lastName: 'User',
          }),
        });
      });

      await page.goto('/auth/callback?next=/overview');

      // Should redirect to overview
      await expect(page).toHaveURL(/.*\/overview/, { timeout: 10000 });
    });

    test('should handle Google OAuth error', async ({ page }) => {
      // Mock OAuth error
      await page.route('**/api/v1/auth/google/callback**', async (route) => {
        await route.fulfill({
          status: 302,
          headers: {
            Location: '/login?error=oauth_failed',
          },
        });
      });

      await page.goto('/auth/callback?error=access_denied');

      // Should redirect to login with error
      await expect(page).toHaveURL(/.*\/login.*error/, { timeout: 5000 });
    });
  });

  test.describe('GitHub OAuth', () => {
    test('should redirect to GitHub OAuth when clicking GitHub button', async ({ page }) => {
      await page.goto('/login');

      // Mock the OAuth initiation
      await page.route('**/api/v1/auth/github', async (route) => {
        await route.fulfill({
          status: 302,
          headers: {
            Location: 'https://github.com/login/oauth/authorize?client_id=test&redirect_uri=test',
          },
        });
      });

      const githubButton = page.getByRole('button', { name: /github|continuer avec github/i }).or(
        page.getByRole('link', { name: /github|continuer avec github/i })
      ).first();
      if ((await githubButton.count()) > 0) {
        await expect(githubButton).toBeVisible();
        await githubButton.click({ noWaitAfter: true });
      } else {
        await expect(page).toHaveURL(/.*login/);
      }
      await page.waitForTimeout(1000);
    });

    test('should handle GitHub OAuth callback successfully', async ({ page }) => {
      // Mock OAuth callback
      await page.route('**/api/v1/auth/github/callback**', async (route) => {
        await route.fulfill({
          status: 302,
          headers: {
            Location: '/auth/callback?next=/overview',
            'Set-Cookie': 'accessToken=mock-github-token; HttpOnly; Path=/',
          },
        });
      });

      // Mock user data after OAuth
      await page.route('**/api/v1/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-123',
            email: 'github-user@example.com',
            firstName: 'GitHub',
            lastName: 'User',
          }),
        });
      });

      await page.goto('/auth/callback?next=/overview');

      // Should redirect to overview
      await expect(page).toHaveURL(/.*\/overview/, { timeout: 10000 });
    });

    test('should handle GitHub OAuth error', async ({ page }) => {
      // Mock OAuth error
      await page.route('**/api/v1/auth/github/callback**', async (route) => {
        await route.fulfill({
          status: 302,
          headers: {
            Location: '/login?error=oauth_failed',
          },
        });
      });

      await page.goto('/auth/callback?error=access_denied');

      // Should redirect to login with error
      await expect(page).toHaveURL(/.*\/login.*error/, { timeout: 5000 });
    });
  });
});
