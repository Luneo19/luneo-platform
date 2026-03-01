import { test, expect } from '@playwright/test';
import { loginUser } from '../utils/auth';
import { setLocale, ensureCookieBannerClosed } from '../utils/locale';

/**
 * Smoke minimal: onboarding + dashboard navigation.
 */

test.describe('Smoke Onboarding + Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
    await loginUser(page);
  });

  test('onboarding route is reachable after auth', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/onboarding|overview|dashboard/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('overview and key dashboard pages are reachable', async ({ page }) => {
    const targets = ['/overview', '/agents', '/analytics', '/billing', '/settings'];

    for (const target of targets) {
      await page.goto(target);
      await page.waitForLoadState('domcontentloaded');

      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
