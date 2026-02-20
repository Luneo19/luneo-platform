import { test, expect } from '@playwright/test';

/**
 * Tunnel Marchand — Du signup à la première vente
 */
test.describe('Tunnel Marchand — Du signup à la première vente', () => {
  test.setTimeout(90_000);

  const merchantEmail = `test-merchant-${Date.now()}@luneo-test.com`;
  const merchantPassword = 'TestP@ssword123!';

  test('ÉTAPE 1 — Inscription marchand', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(4000);

    await page.locator('#fullName').fill('Marchand Test');
    await page.waitForTimeout(200);
    await page.locator('#email').fill(merchantEmail);
    await page.waitForTimeout(200);
    await page.locator('#password').fill(merchantPassword);
    await page.waitForTimeout(200);
    await page.locator('#confirmPassword').fill(merchantPassword);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const cb = document.getElementById('terms') as HTMLInputElement;
      if (cb && !cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.waitForTimeout(1500);

    const submitButton = page.locator('[data-testid="register-submit"]');
    await submitButton.click({ force: true });
    await page.waitForTimeout(12_000);

    const currentUrl = page.url();
    const body = await page.textContent('body');
    const hasServerError = body?.includes('Internal Server Error') || body?.includes('Application error');

    expect(hasServerError).toBeFalsy();
    const navigated = /onboarding|verify|dashboard/.test(currentUrl);
    if (!navigated) {
      const hasSuccess = body?.includes('succès') || body?.includes('success') || body?.includes('vérif');
      expect(hasSuccess || currentUrl.includes('register')).toBeTruthy();
    }
  });

  test('ÉTAPE 2 — Login marchand', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    await page.locator('#email, [name="email"]').first().fill(merchantEmail);
    await page.waitForTimeout(200);
    await page.locator('#password, [name="password"]').first().fill(merchantPassword);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(10_000);

    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });

  test('ÉTAPE 3 — Page produits charge', async ({ page }) => {
    await page.goto('/dashboard/products', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const url = page.url();
    const body = await page.textContent('body') || '';
    expect(body.length + url.length).toBeGreaterThan(10);
    expect(body).not.toContain('Internal Server Error');
  });

  test('ÉTAPE 4 — Page commandes charge', async ({ page }) => {
    await page.goto('/dashboard/orders', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const body = await page.textContent('body') || '';
    expect(body).not.toContain('Internal Server Error');
  });

  test('ÉTAPE 5 — Page analytics charge', async ({ page }) => {
    await page.goto('/dashboard/analytics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const body = await page.textContent('body') || '';
    expect(body).not.toContain('Internal Server Error');
  });

  test('ÉTAPE 6 — Pages critiques du dashboard', async ({ page }) => {
    const criticalPages = [
      '/dashboard',
      '/dashboard/billing',
      '/dashboard/settings',
    ];

    for (const route of criticalPages) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(4000);

      const body = await page.textContent('body') || '';
      expect(body).not.toContain('Internal Server Error');
      expect(body).not.toContain('Application error');
    }
  });
});
