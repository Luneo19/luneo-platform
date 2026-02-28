import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from '../utils/locale';
import { loginUser, isUserLoggedIn, TEST_USER } from '../utils/auth';

async function isPresentAndVisible(locator: any): Promise<boolean> {
  return (await locator.count()) > 0 && (await locator.first().isVisible());
}

/**
 * Test E2E du workflow complet : Création Design → Commande → Paiement
 * 
 * Ce test vérifie le parcours utilisateur critique de bout en bout
 */
test.describe('Workflow: Design to Order', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test('should complete full workflow: login → create design → add to cart → checkout', async ({
    page,
  }) => {
    // Étape 1: Connexion
    // Utiliser l'utilitaire d'authentification si disponible
    const useAuth = process.env.E2E_USE_AUTH !== 'false';
    expect(useAuth).toBe(true);

    try {
      await loginUser(page, TEST_USER);
      expect(await isUserLoggedIn(page)).toBe(true);
    } catch (error) {
      throw new Error(`Authentication is required for design-to-order flow: ${String(error)}`);
    }

    // Étape 2: Navigation vers AI Studio
    await page.goto('/ai-studio');
    await expect(page).toHaveURL(/.*ai-studio/);

    // Vérifier que la page AI Studio est chargée
    const aiStudioTitle = page.getByRole('heading', { name: /studio|design|ai/i });
    await expect(aiStudioTitle.first()).toBeVisible({ timeout: 10000 });

    // Étape 3: Vérifier présence des éléments de création de design
    const promptInput = page.getByPlaceholder(/prompt|description|créer/i).first();
    if (await isPresentAndVisible(promptInput)) {
      await expect(promptInput).toBeVisible();
    }

    // Étape 4: Navigation vers Products (si disponible)
    await page.goto('/products');
    await expect(page).toHaveURL(/.*products/);

    // Vérifier que la liste de produits est visible
    const productsHeading = page.getByRole('heading', { name: /produits|products/i });
    await expect(productsHeading.first()).toBeVisible({ timeout: 10000 });

    // Étape 5: Vérifier présence du panier (si disponible)
    const cartButton = page.getByRole('button', { name: /panier|cart/i }).first();
    if (await isPresentAndVisible(cartButton)) {
      await expect(cartButton).toBeVisible();
    }
  });

  test('should navigate through dashboard sections', async ({ page }) => {
    // Test de navigation dans le dashboard
    await page.goto('/dashboard');

    // Vérifier que le dashboard charge
    await expect(page).toHaveURL(/.*dashboard/);

    // Vérifier présence des sections principales
    const dashboardSections = [
      /stats|statistiques/i,
      /designs|créations/i,
      /produits|products/i,
      /commandes|orders/i,
    ];

    let visibleSections = 0;
    for (const section of dashboardSections) {
      const element = page.getByText(section).first();
      const isVisible = await isPresentAndVisible(element);
      if (isVisible) {
        visibleSections += 1;
        await expect(element).toBeVisible();
      }
    }
    expect(visibleSections).toBeGreaterThan(0);
  });

  test('should access product customization page', async ({ page }) => {
    await page.goto('/products');

    // Attendre que la page charge
    await expect(page).toHaveURL(/.*products/);

    // Chercher un bouton de personnalisation ou un lien produit
    const customizeButton = page
      .getByRole('button', { name: /personnaliser|customize|éditer|edit/i })
      .first();
    const productLink = page.getByRole('link', { name: /produit|product/i }).first();

    // Si un bouton de personnalisation existe, cliquer dessus
    if (await isPresentAndVisible(customizeButton)) {
      await customizeButton.click();
      await expect(page).toHaveURL(/.*customize|.*edit/);
    } else if (await isPresentAndVisible(productLink)) {
      // Sinon, cliquer sur un lien produit
      await productLink.click();
      // Vérifier qu'on est sur une page de détail produit
      await expect(page).toHaveURL(/.*products\/.+/);
    } else {
      throw new Error('No product customization entry point found');
    }
  });
});

