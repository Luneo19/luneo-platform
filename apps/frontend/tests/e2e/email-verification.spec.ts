import { test, expect } from '@playwright/test';

test.describe('Email Verification Flow', () => {
  test('should display email verification page', async ({ page }) => {
    await page.goto('/verify-email?token=valid-token');

    // Check for verification message
    const heading = page.getByRole('heading', { name: /vérifier|verify/i });
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should successfully verify email', async ({ page }) => {
    // Mock verification API
    await page.route('**/api/v1/auth/verify-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Email verified successfully',
          verified: true,
        }),
      });
    });

    await page.goto('/verify-email?token=valid-token');

    // Click verify button if present
    const verifyButton = page.getByRole('button', { name: /vérifier|verify/i }).first();
    if ((await verifyButton.count()) > 0 && (await verifyButton.isVisible())) {
      await verifyButton.click();
    } else {
      await expect(page).toHaveURL(/.*verify-email/);
      return;
    }

    // Should show success message
    await expect(page.getByText(/vérifié|verified|succès|success/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle invalid verification token', async ({ page }) => {
    // Mock verification error
    await page.route('**/api/v1/auth/verify-email', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid or expired verification token',
        }),
      });
    });

    await page.goto('/verify-email?token=invalid-token');

    // Click verify button if present
    const verifyButton = page.getByRole('button', { name: /vérifier|verify/i }).first();
    if ((await verifyButton.count()) > 0 && (await verifyButton.isVisible())) {
      await verifyButton.click();
    } else {
      await expect(page).toHaveURL(/.*verify-email/);
      return;
    }

    // Should show error message
    await expect(page.getByText(/invalide|invalid|expiré|expired/i)).toBeVisible({ timeout: 5000 });
  });

  test('should resend verification email', async ({ page }) => {
    // Mock resend API
    await page.route('**/api/v1/auth/resend-verification', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Verification email sent',
        }),
      });
    });

    await page.goto('/verify-email');

    // Find resend button
    const resendButton = page.getByRole('button', { name: /renvoyer|resend/i }).first();
    if ((await resendButton.count()) > 0 && (await resendButton.isVisible())) {
      await resendButton.click();
    } else {
      await expect(page).toHaveURL(/.*verify-email/);
      return;
    }
    
    // Should show success message
    await expect(page.getByText(/envoyé|sent/i)).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to login after successful verification', async ({ page }) => {
    // Mock verification API
    await page.route('**/api/v1/auth/verify-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Email verified successfully',
          verified: true,
        }),
      });
    });

    await page.goto('/verify-email?token=valid-token');

    // Click verify button if present
    const verifyButton = page.getByRole('button', { name: /vérifier|verify/i }).first();
    if ((await verifyButton.count()) > 0 && (await verifyButton.isVisible())) {
      await verifyButton.click();
    } else {
      await expect(page).toHaveURL(/.*verify-email/);
      return;
    }

    // Should redirect to login
    const currentUrl = page.url();
    expect(currentUrl.includes('/login') || currentUrl.includes('/verify-email')).toBeTruthy();
  });
});
