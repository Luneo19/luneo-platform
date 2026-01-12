import { test, expect } from '@playwright/test';

test.describe('Security Settings - 2FA', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/settings/security');
    
    // Mock user being logged in
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
      }));
    });
  });

  test('should display security settings page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Sécurité")')).toBeVisible();
  });

  test('should show setup 2FA button when 2FA is disabled', async ({ page }) => {
    // Mock API response for 2FA disabled
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: 'test@example.com',
          is2FAEnabled: false,
        }),
      });
    });

    await page.reload();
    
    await expect(page.locator('button:has-text("Configurer la 2FA")')).toBeVisible();
  });

  test('should show QR code when setting up 2FA', async ({ page }) => {
    // Mock setup 2FA response
    await page.route('**/api/v1/auth/2fa/setup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secret: 'MOCK_SECRET_KEY',
          qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          backupCodes: ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345', 'PQR678', 'STU901', 'VWX234', 'YZA567', 'BCD890'],
        }),
      });
    });

    await page.locator('button:has-text("Configurer la 2FA")').click();

    // Should show QR code
    await expect(page.locator('img[alt="QR Code 2FA"]')).toBeVisible({ timeout: 5000 });
    
    // Should show backup codes section
    await expect(page.locator('text=/ABC123/')).toBeVisible();
  });

  test('should verify and enable 2FA', async ({ page }) => {
    // Mock setup response
    await page.route('**/api/v1/auth/2fa/setup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secret: 'MOCK_SECRET',
          qrCodeUrl: 'data:image/png;base64,test',
          backupCodes: ['ABC123', 'DEF456'],
        }),
      });
    });

    // Mock verify response
    await page.route('**/api/v1/auth/2fa/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '2FA enabled successfully',
          backupCodes: ['ABC123', 'DEF456'],
        }),
      });
    });

    await page.locator('button:has-text("Configurer la 2FA")').click();
    
    // Wait for QR code
    await page.locator('img[alt="QR Code 2FA"]').waitFor({ state: 'visible' });

    // Enter verification code
    const codeInput = page.locator('input[placeholder="123456"]');
    await codeInput.fill('123456');
    
    await page.locator('button:has-text("Activer la 2FA")').click();

    // Should show success message
    await expect(page.locator('text=/2FA activée avec succès/')).toBeVisible({ timeout: 5000 });
  });

  test('should allow disabling 2FA', async ({ page }) => {
    // Mock 2FA enabled
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: 'test@example.com',
          is2FAEnabled: true,
        }),
      });
    });

    // Mock disable response
    await page.route('**/api/v1/auth/2fa/disable', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '2FA disabled successfully',
        }),
      });
    });

    await page.reload();
    
    // Should show disable button
    const disableButton = page.locator('button:has-text("Désactiver la 2FA")');
    await expect(disableButton).toBeVisible();

    // Click disable (will trigger confirm dialog)
    await page.evaluate(() => {
      window.confirm = () => true; // Auto-confirm
    });
    
    await disableButton.click();

    // Should show success message
    await expect(page.locator('text=/2FA désactivée avec succès/')).toBeVisible({ timeout: 5000 });
  });
});
