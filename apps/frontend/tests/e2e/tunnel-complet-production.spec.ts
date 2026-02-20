import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Tunnel de conversion COMPLET', () => {
  test.setTimeout(90_000);

  const timestamp = Date.now();
  const merchantEmail = `merchant-${timestamp}@luneo-test.com`;
  const merchantPassword = 'MerchantTest123!';

  async function loginAs(page: Page, email: string, password: string) {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);
    await page.locator('#email, [name="email"]').first().fill(email);
    await page.locator('#password, [name="password"]').first().fill(password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(8000);
  }

  test.describe.serial('A — Parcours Marchand', () => {
    test('A1 — Landing page fonctionne', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.screenshot({ path: 'test-results/A1-landing.png', fullPage: true });
      const body = await page.textContent('body');
      expect(body?.length).toBeGreaterThan(100);
      expect(body).not.toContain('Application error');
    });

    test('A2 — Inscription marchand', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/A2-register.png' });

      const nameField = page.locator('#fullName, [name="name"], [name="firstName"]');
      if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameField.fill('Marchand Test');
      }
      await page.locator('#email, [name="email"]').first().fill(merchantEmail);
      await page.locator('#password, [name="password"]').first().fill(merchantPassword);

      const confirmField = page.locator('#confirmPassword, [name="confirmPassword"]');
      if (await confirmField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmField.fill(merchantPassword);
      }

      const terms = page.locator('#terms, [name="terms"], input[type="checkbox"]');
      if (await terms.isVisible({ timeout: 2000 }).catch(() => false)) {
        await terms.check({ force: true });
      }

      await page.click('button[type="submit"], [data-testid="register-submit"]');
      await page.waitForTimeout(10_000);
      await page.screenshot({ path: 'test-results/A2-after-register.png' });

      const body = await page.textContent('body');
      expect(body).not.toContain('Internal Server Error');
    });

    test('A3 — Login et dashboard', async ({ page }) => {
      await loginAs(page, merchantEmail, merchantPassword);
      await page.screenshot({ path: 'test-results/A3-dashboard.png', fullPage: true });

      const body = await page.textContent('body');
      expect(body).not.toContain('Application error');
      expect(body).not.toContain('Internal Server Error');
    });

    test('A4 — Page produits', async ({ page }) => {
      await page.goto('/dashboard/products', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: 'test-results/A4-products.png', fullPage: true });

      const body = await page.textContent('body');
      expect(body).not.toContain('Internal Server Error');
    });

    test('A5 — Toutes les pages dashboard chargent', async ({ page }) => {
      const pages = [
        '/dashboard', '/dashboard/products', '/dashboard/orders',
        '/dashboard/analytics', '/dashboard/billing', '/dashboard/settings',
        '/dashboard/ai-studio', '/dashboard/library', '/dashboard/team',
        '/dashboard/support',
      ];
      const failures: string[] = [];
      for (const url of pages) {
        try {
          const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
          const body = await page.textContent('body');
          if (response && response.status() >= 500) failures.push(`${url} -> ${response.status()}`);
          if (body?.includes('Application error') || body?.includes('Internal Server Error')) {
            failures.push(`${url} -> Erreur React/Serveur`);
          }
          await page.screenshot({ path: `test-results/A5-${url.replace(/\//g, '_')}.png` });
        } catch (e: unknown) {
          failures.push(`${url} -> ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      expect(failures).toHaveLength(0);
    });
  });

  test.describe.serial('B — Parcours Client Final', () => {
    test('B1 — Demo customizer charge', async ({ page }) => {
      await page.goto('/demo/customizer', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'test-results/B1-customizer.png', fullPage: true });

      const body = await page.textContent('body');
      expect(body?.length).toBeGreaterThan(100);
      expect(body).not.toContain('Application error');
    });

    test('B2 — Interaction customizer', async ({ page }) => {
      await page.goto('/demo/customizer', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);

      const textTool = page.locator(
        'button:has-text("Texte"), button:has-text("Text"), [data-tool="text"]'
      );
      if (await textTool.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await textTool.first().click();
        await page.screenshot({ path: 'test-results/B2-text-tool.png' });
      }
      const body = await page.textContent('body');
      expect(body).not.toContain('Internal Server Error');
    });

    test('B3 — Checkout accessible', async ({ page }) => {
      await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/B3-checkout.png', fullPage: true });

      const body = await page.textContent('body');
      expect(body).not.toContain('Internal Server Error');
    });

    test('B4 — Responsive mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.screenshot({ path: 'test-results/B4-mobile-home.png', fullPage: true });

      await page.goto('/demo/customizer', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/B4-mobile-customizer.png', fullPage: true });

      await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
      await page.screenshot({ path: 'test-results/B4-mobile-pricing.png', fullPage: true });

      const body = await page.textContent('body');
      expect(body).not.toContain('Application error');
    });
  });
});
