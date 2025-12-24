import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test('should navigate to login page from navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-login').click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('login-title')).toContainText('Connexion');
  });

  test('should display login form controls', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-remember')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeEnabled();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordField = page.getByTestId('login-password');
    await passwordField.fill('Secret123!');
    await page.getByTestId('login-toggle-password').click();
    await expect(passwordField).toHaveAttribute('type', 'text');
  });

  test('should access registration page from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-switch-register').click();
    await expect(page).toHaveURL('/register');
  });
});
