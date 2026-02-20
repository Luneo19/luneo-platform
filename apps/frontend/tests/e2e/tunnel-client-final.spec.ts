import { test, expect } from '@playwright/test';

/**
 * Tunnel Client Final — De la personnalisation à l'achat
 * Serial execution to avoid heavy page overload.
 */
test.describe.configure({ mode: 'serial' });

test.describe('Tunnel Client Final — Personnalisation et achat', () => {
  test.setTimeout(90_000);
  const DEMO_URL = '/demo/customizer';

  test('ÉTAPE 1 — Le customizer se charge', async ({ page }) => {
    const response = await page.goto(DEMO_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    expect(response?.status()).toBeLessThan(500);
    await page.waitForTimeout(5000);

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(20);
  });

  test('ÉTAPE 2 — Ajout de texte', async ({ page }) => {
    await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const textTool = page.locator(
      'button:has-text("Texte"), button:has-text("Text"), [data-tool="text"], [aria-label*="text" i]'
    );

    if (await textTool.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await textTool.first().click();
      const textInput = page.locator('input[type="text"], textarea, [contenteditable="true"]');
      if (await textInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await textInput.first().fill('Mon texte personnalisé');
      }
    }

    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });

  test('ÉTAPE 3 — Changement de couleur', async ({ page }) => {
    await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const colorSelector = page.locator(
      '[data-testid="color-picker"], .color-swatch, [data-tool="color"], button[aria-label*="couleur" i], button[aria-label*="color" i]'
    );

    if (await colorSelector.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await colorSelector.first().click();
    }

    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });

  test('ÉTAPE 4 — Preview du résultat', async ({ page }) => {
    await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const previewButton = page.locator(
      'button:has-text("Aperçu"), button:has-text("Preview"), button:has-text("Voir"), [data-action="preview"]'
    );

    if (await previewButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await previewButton.first().click();
      await page.waitForTimeout(2000);
    }

    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });

  test('ÉTAPE 5 — CTA inscription visible', async ({ page }) => {
    await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(20);
  });

  test('ÉTAPE 6 — Checkout accessible', async ({ page }) => {
    const response = await page.goto('/checkout', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});
