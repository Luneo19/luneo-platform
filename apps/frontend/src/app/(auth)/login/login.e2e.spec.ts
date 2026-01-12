import { test, expect } from '@playwright/test';

test.describe('Login Page - 2FA Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByTestId('login-title')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByTestId('login-email').fill('invalid@example.com');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByTestId('login-submit').click();

    // Wait for error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 5000 });
  });

  test('should show 2FA form when user has 2FA enabled', async ({ page }) => {
    // Mock API response for 2FA required
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          requires2FA: true,
          tempToken: 'mock-temp-token',
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        }),
      });
    });

    await page.getByTestId('login-email').fill('test@example.com');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();

    // Should show 2FA form
    await expect(page.locator('input[placeholder="123456"]')).toBeVisible({ timeout: 5000 });
  });

  test('should validate 2FA code length', async ({ page }) => {
    // Mock 2FA required response
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          requires2FA: true,
          tempToken: 'mock-temp-token',
          user: { id: 'user-123', email: 'test@example.com' },
        }),
      });
    });

    await page.getByTestId('login-email').fill('test@example.com');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();

    // Wait for 2FA form
    const codeInput = page.locator('input[placeholder="123456"]');
    await codeInput.waitFor({ state: 'visible' });

    // Try to submit with invalid code length
    await codeInput.fill('123');
    const submitButton = page.locator('button:has-text("Vérifier")');
    await expect(submitButton).toBeDisabled();
  });

  test('should handle 2FA login success', async ({ page }) => {
    // Mock 2FA required
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          requires2FA: true,
          tempToken: 'mock-temp-token',
          user: { id: 'user-123', email: 'test@example.com' },
        }),
      });
    });

    // Mock 2FA login success
    await page.route('**/api/v1/auth/login/2fa', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          },
        }),
        headers: {
          'Set-Cookie': 'accessToken=mock-token; HttpOnly; Path=/',
        },
      });
    });

    await page.getByTestId('login-email').fill('test@example.com');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();

    // Enter 2FA code
    const codeInput = page.locator('input[placeholder="123456"]');
    await codeInput.waitFor({ state: 'visible' });
    await codeInput.fill('123456');
    
    const verifyButton = page.locator('button:has-text("Vérifier")');
    await verifyButton.click();

    // Should redirect to overview
    await expect(page).toHaveURL(/.*\/overview/, { timeout: 10000 });
  });
});
