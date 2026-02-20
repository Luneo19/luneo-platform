import { test, expect } from '@playwright/test';

test.describe('Pages publiques — Tout doit charger', () => {
  test.setTimeout(60_000);

  const publicPages = [
    { url: '/', name: 'Home' },
    { url: '/pricing', name: 'Pricing' },
    { url: '/contact', name: 'Contact' },
    { url: '/about', name: 'About' },
    { url: '/login', name: 'Login' },
    { url: '/register', name: 'Register' },
    { url: '/demo/customizer', name: 'Demo Customizer' },
    { url: '/help-center', name: 'Help Center' },
    { url: '/blog', name: 'Blog' },
    { url: '/changelog', name: 'Changelog' },
  ];

  for (const pageInfo of publicPages) {
    test(`${pageInfo.name} (${pageInfo.url}) charge correctement`, async ({ page }) => {
      const response = await page.goto(pageInfo.url, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

      expect(response?.status()).toBeLessThan(500);

      await page.waitForTimeout(3000);

      const visibleText = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        return main?.innerText || '';
      });

      expect(visibleText.length).toBeGreaterThan(10);
    });
  }
});
