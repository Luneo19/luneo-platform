import { test, expect } from '@playwright/test';

test.describe('Customization Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to widget page
    await page.goto('/w/test-brand/test-product');
  });

  test('should complete full customization flow', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=Personnaliser', { timeout: 10000 });

    // Select a zone
    const zoneButton = page.locator('button:has-text("Zone")').first();
    if (await zoneButton.isVisible()) {
      await zoneButton.click();
    }

    // Enter prompt
    const promptInput = page.locator('input[placeholder*="prompt"], textarea[placeholder*="prompt"]').first();
    if (await promptInput.isVisible()) {
      await promptInput.fill('Test customization prompt');
    }

    // Generate customization
    const generateButton = page.locator('button:has-text("Générer"), button:has-text("Créer")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
    }

    // Wait for preview
    await page.waitForTimeout(2000);

    // Verify preview is shown
    const preview = page.locator('canvas, img[alt*="preview"], [data-testid*="preview"]').first();
    await expect(preview).toBeVisible({ timeout: 10000 });

    // Add to cart
    const addToCartButton = page.locator('button:has-text("Ajouter"), button:has-text("Panier")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
    }

    // Verify success message
    await expect(page.locator('text=succès, text=ajouté')).toBeVisible({ timeout: 5000 });
  });
});

