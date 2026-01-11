/**
 * E2E Test - Personalization Flow avec Aria
 * Test du parcours complet de personnalisation avec l'agent Aria
 */

import { test, expect } from '@playwright/test';

test.describe('Personalization Flow with Aria', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers la page produit
    await page.goto('/products/test-product');
  });

  test('should complete personalization flow with Aria suggestions', async ({
    page,
  }) => {
    // 1. Ouvrir le widget Aria
    await page.click('[aria-label="Ouvrir Aria"]');
    await expect(page.locator('text=Aria')).toBeVisible();

    // 2. Sélectionner une occasion
    await page.click('text=Anniversaire');
    await expect(page.locator('text=Suggestions')).toBeVisible();

    // 3. Sélectionner une suggestion
    const firstSuggestion = page.locator('[data-testid="aria-suggestion"]').first();
    const suggestionText = await firstSuggestion.textContent();
    await firstSuggestion.click();

    // 4. Vérifier que le texte a été appliqué
    await expect(page.locator('input[placeholder*="texte"]')).toHaveValue(
      suggestionText || '',
    );

    // 5. Demander une amélioration via chat
    await page.click('text=Chat');
    await page.fill('input[placeholder*="Demandez"]', 'Peux-tu améliorer ce texte ?');
    await page.click('button[type="submit"]');

    // 6. Vérifier la réponse d'Aria
    await expect(page.locator('text=Aria')).toBeVisible();
    await expect(page.locator('.aria-message')).toContainText('amélioré');
  });

  test('should handle Aria widget errors gracefully', async ({ page }) => {
    // Simuler une erreur API
    await page.route('**/agents/aria/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Ouvrir Aria
    await page.click('[aria-label="Ouvrir Aria"]');

    // Essayer d'envoyer un message
    await page.fill('input[placeholder*="Demandez"]', 'Test');
    await page.click('button[type="submit"]');

    // Vérifier le message d'erreur
    await expect(page.locator('text=erreur')).toBeVisible();
  });
});
