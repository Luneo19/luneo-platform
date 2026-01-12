import { test, expect } from '@playwright/test';

test.describe('Reset Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate coming from email link with token
    await page.goto('/reset-password?token=valid-reset-token');
  });

  test('should display reset password form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /réinitialiser|reset password/i })).toBeVisible();
    await expect(page.getByLabel(/nouveau mot de passe|new password/i)).toBeVisible();
    await expect(page.getByLabel(/confirmer|confirm/i)).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.getByLabel(/nouveau mot de passe|new password/i).fill('weak');
    await page.getByRole('button', { name: /réinitialiser|reset/i }).click();

    await expect(page.getByText(/au moins 8 caractères|at least 8 characters/i)).toBeVisible({ timeout: 3000 });
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.getByLabel(/nouveau mot de passe|new password/i).fill('SecurePass123!');
    await page.getByLabel(/confirmer|confirm/i).fill('DifferentPass123!');
    await page.getByRole('button', { name: /réinitialiser|reset/i }).click();

    await expect(page.getByText(/ne correspondent pas|do not match/i)).toBeVisible({ timeout: 3000 });
  });

  test('should successfully reset password', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password reset successfully',
        }),
      });
    });

    await page.getByLabel(/nouveau mot de passe|new password/i).fill('SecurePass123!');
    await page.getByLabel(/confirmer|confirm/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /réinitialiser|reset/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
    await expect(page.getByText(/mot de passe réinitialisé|password reset/i)).toBeVisible({ timeout: 3000 });
  });

  test('should handle invalid token error', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token');

    // Mock API error
    await page.route('**/api/v1/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid or expired token',
        }),
      });
    });

    await page.getByLabel(/nouveau mot de passe|new password/i).fill('SecurePass123!');
    await page.getByLabel(/confirmer|confirm/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /réinitialiser|reset/i }).click();

    await expect(page.getByText(/token invalide|invalid token/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle expired token error', async ({ page }) => {
    await page.goto('/reset-password?token=expired-token');

    // Mock API error
    await page.route('**/api/v1/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Token expired',
        }),
      });
    });

    await page.getByLabel(/nouveau mot de passe|new password/i).fill('SecurePass123!');
    await page.getByLabel(/confirmer|confirm/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /réinitialiser|reset/i }).click();

    await expect(page.getByText(/expiré|expired/i)).toBeVisible({ timeout: 5000 });
  });
});
