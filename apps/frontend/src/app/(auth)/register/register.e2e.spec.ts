import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /créer un compte|create account/i })).toBeVisible();
    await expect(page.getByLabel(/prénom|first name/i)).toBeVisible();
    await expect(page.getByLabel(/nom|last name/i)).toBeVisible();
    await expect(page.getByLabel(/email|e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe|password/i).first()).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /créer|create/i }).click();

    await expect(page.getByText(/requis|required/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('should show password strength requirements', async ({ page }) => {
    const passwordInput = page.getByLabel(/mot de passe|password/i).first();
    await passwordInput.fill('weak');

    await expect(page.getByText(/au moins 8 caractères|at least 8 characters/i)).toBeVisible({ timeout: 3000 });
  });

  test('should successfully register new user', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/auth/signup', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'newuser@example.com',
              firstName: 'Test',
              lastName: 'User',
            },
          },
        }),
        headers: {
          'Set-Cookie': 'accessToken=mock-token; HttpOnly; Path=/',
        },
      });
    });

    const uniqueEmail = `test-${Date.now()}@example.com`;

    await page.getByLabel(/prénom|first name/i).fill('Test');
    await page.getByLabel(/nom|last name/i).fill('User');
    await page.getByLabel(/email|e-mail/i).fill(uniqueEmail);
    await page.getByLabel(/mot de passe|password/i).first().fill('SecurePass123!');
    
    // Check terms if present
    const termsCheckbox = page.getByLabel(/j'accepte|i accept/i).first();
    if (await termsCheckbox.isVisible().catch(() => false)) {
      await termsCheckbox.check();
    }

    await page.getByRole('button', { name: /créer|create/i }).click();

    // Should redirect to dashboard or verification page
    await expect(page).toHaveURL(/.*dashboard|.*verify|.*overview/, { timeout: 10000 });
  });

  test('should handle duplicate email error', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/auth/signup', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'User already exists',
        }),
      });
    });

    await page.getByLabel(/prénom|first name/i).fill('Test');
    await page.getByLabel(/nom|last name/i).fill('User');
    await page.getByLabel(/email|e-mail/i).fill('existing@example.com');
    await page.getByLabel(/mot de passe|password/i).first().fill('SecurePass123!');
    await page.getByRole('button', { name: /créer|create/i }).click();

    await expect(page.getByText(/existe déjà|already exists/i)).toBeVisible({ timeout: 5000 });
  });

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /déjà un compte|already have an account/i });
    await expect(loginLink).toBeVisible();
    
    await loginLink.click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should handle CAPTCHA if present', async ({ page }) => {
    // Mock CAPTCHA verification
    await page.route('**/api/v1/auth/signup', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      if (!postData?.captchaToken) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'CAPTCHA verification required',
          }),
        });
        return;
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
            },
          },
        }),
      });
    });

    const uniqueEmail = `test-${Date.now()}@example.com`;

    await page.getByLabel(/prénom|first name/i).fill('Test');
    await page.getByLabel(/nom|last name/i).fill('User');
    await page.getByLabel(/email|e-mail/i).fill(uniqueEmail);
    await page.getByLabel(/mot de passe|password/i).first().fill('SecurePass123!');
    await page.getByRole('button', { name: /créer|create/i }).click();

    // CAPTCHA should be handled automatically or show error
    await page.waitForTimeout(2000);
  });
});
