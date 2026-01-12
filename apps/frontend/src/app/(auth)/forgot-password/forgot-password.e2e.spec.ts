import { test, expect } from '@playwright/test';

test.describe('Forgot Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('should display forgot password form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /mot de passe oublié|forgot password/i })).toBeVisible();
    await expect(page.getByLabel(/email|e-mail/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /envoyer|send/i })).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByLabel(/email|e-mail/i).fill('invalid-email');
    await page.getByRole('button', { name: /envoyer|send/i }).click();

    await expect(page.getByText(/email invalide|invalid email/i)).toBeVisible({ timeout: 3000 });
  });

  test('should show success message after submitting valid email', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password reset email sent',
        }),
      });
    });

    await page.getByLabel(/email|e-mail/i).fill('test@example.com');
    await page.getByRole('button', { name: /envoyer|send/i }).click();

    await expect(page.getByText(/email envoyé|email sent/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Internal server error',
        }),
      });
    });

    await page.getByLabel(/email|e-mail/i).fill('test@example.com');
    await page.getByRole('button', { name: /envoyer|send/i }).click();

    await expect(page.getByText(/erreur|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('should have link back to login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /retour à la connexion|back to login/i });
    await expect(loginLink).toBeVisible();
    
    await loginLink.click();
    await expect(page).toHaveURL(/.*\/login/);
  });
});
