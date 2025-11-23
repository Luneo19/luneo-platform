import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';

test.describe('Internationalisation', () => {
  test('should switch locale to English via selector', async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);

    await page.goto('/');
    await page.getByTestId('locale-switcher-trigger').click();
    await page.getByRole('option', { name: /English/ }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('header input[aria-label="Search designs, projects, clients..."]')).toBeVisible();
  });

  test('should display cookie banner translated', async ({ page }) => {
    await setLocale(page, 'en');
    await page.goto('/');

    const banner = page.getByTestId('cookie-banner');
    await expect(page.getByTestId('cookie-banner-title')).toHaveText(/We use cookies/i);

    await page.getByTestId('cookie-banner-accept-all').click();
    await expect(banner).toBeHidden();
  });

  test('should persist locale across navigation', async ({ page }) => {
    await setLocale(page, 'de');
    await ensureCookieBannerClosed(page);

    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    await page.getByTestId('nav-login').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });
});

