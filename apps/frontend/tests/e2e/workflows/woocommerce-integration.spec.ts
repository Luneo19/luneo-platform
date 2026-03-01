import { test, expect, type Locator } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from '../utils/locale';

async function isPresentAndVisible(locator: Locator): Promise<boolean> {
  return (await locator.count()) > 0 && (await locator.first().isVisible());
}

/**
 * Test E2E du workflow d'intégration WooCommerce
 * 
 * Ce test vérifie le processus de connexion et synchronisation WooCommerce
 */
test.describe('Workflow: WooCommerce Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test('should navigate to integrations page', async ({ page }) => {
    await page.goto('/integrations');
    await expect(page).toHaveURL(/.*integrations/);

    // Vérifier que la page des intégrations charge
    const integrationsHeading = page.getByRole('heading', { name: /intégrations|integrations/i });
    await expect(integrationsHeading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display WooCommerce integration option', async ({ page }) => {
    await page.goto('/integrations');

    // Chercher l'option WooCommerce
    // Vérifier que WooCommerce est mentionné quelque part sur la page
    const pageContent = await page.textContent('body');
    expect(pageContent?.toLowerCase()).toContain('woocommerce');
  });

  test('should access WooCommerce connection form', async ({ page }) => {
    await page.goto('/integrations');

    // Chercher un bouton ou lien pour connecter WooCommerce
    const connectButton = page
      .getByRole('button', { name: /connecter|connect|ajouter|add/i })
      .first();
    const wooCommerceLink = page.getByRole('link', { name: /woocommerce/i }).first();

    // Si un bouton existe, vérifier qu'il est visible
    if (await isPresentAndVisible(connectButton)) {
      await expect(connectButton).toBeVisible();
    } else if (await isPresentAndVisible(wooCommerceLink)) {
      await expect(wooCommerceLink).toBeVisible();
    } else {
      throw new Error('No WooCommerce connection entry point found');
    }
  });

  test('should display integration status if connected', async ({ page }) => {
    await page.goto('/integrations');

    // Chercher des indicateurs de statut (connecté, actif, etc.)
    const statusIndicators = [
      /connecté|connected/i,
      /actif|active/i,
      /synchronisé|synced/i,
      /statut|status/i,
    ];

    let foundStatus = false;
    for (const indicator of statusIndicators) {
      const element = page.getByText(indicator).first();
      const isVisible = await isPresentAndVisible(element);
      if (isVisible) {
        foundStatus = true;
        await expect(element).toBeVisible();
        break; // Trouvé au moins un indicateur
      }
    }
    expect(foundStatus).toBeTruthy();
  });
});

