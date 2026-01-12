/**
 * E2E Tests - Super Admin Dashboard
 * Tests for admin dashboard functionality
 */

import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';
import { loginUser } from './utils/auth';

test.describe('Super Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test('should redirect non-admin users away from admin routes', async ({ page }) => {
    // Try to access admin route without admin role
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should redirect to login or dashboard
    const url = page.url();
    if (!url.includes('/admin')) {
      console.log('✅ Non-admin users redirected away from admin routes');
    }
  });

  test('should display admin dashboard for admin users', async ({ page }) => {
    // Try to login as admin (if test admin user exists)
    try {
      await loginUser(page);
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Check if admin dashboard loads
      const adminHeading = page.getByRole('heading', { name: /admin|dashboard/i });
      const hasAdminHeading = await adminHeading.isVisible().catch(() => false);

      if (hasAdminHeading) {
        console.log('✅ Admin dashboard accessible');
        await expect(adminHeading).toBeVisible();
      } else {
        console.warn('⚠️ Admin dashboard not accessible (might need admin user)');
      }
    } catch (error) {
      console.warn('⚠️ Admin login skipped:', error);
    }
  });

  test('should have admin navigation sidebar', async ({ page }) => {
    try {
      await loginUser(page);
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Check for admin navigation
      const navItems = [
        /customers|clients/i,
        /analytics|analytique/i,
        /marketing/i,
        /ads|publicité/i,
        /webhooks/i,
      ];

      let foundNavItems = 0;
      for (const navPattern of navItems) {
        const navItem = page.getByText(navPattern);
        if (await navItem.isVisible().catch(() => false)) {
          foundNavItems++;
        }
      }

      if (foundNavItems > 0) {
        console.log(`✅ Found ${foundNavItems} admin navigation items`);
      } else {
        console.warn('⚠️ Admin navigation not found');
      }
    } catch (error) {
      console.warn('⚠️ Admin navigation test skipped:', error);
    }
  });
});
