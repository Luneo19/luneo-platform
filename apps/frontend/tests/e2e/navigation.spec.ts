import { test, expect } from '@playwright/test';
import { setLocale, ensureCookieBannerClosed } from './utils/locale';

/**
 * 🧭 Tests E2E - Navigation & Dropdowns
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test('should open dropdowns on click', async ({ page }) => {
    await page.goto('/');
    
    // Test dropdown Produit
    await page.getByTestId('nav-dropdown-product').click();
    await expect(page.locator('text=AI Studio')).toBeVisible();
    await expect(page.locator('text=Templates')).toBeVisible();
    
    // Fermer en cliquant à nouveau
    await page.getByTestId('nav-dropdown-product').click();
    await expect(page.locator('text=AI Studio')).not.toBeVisible();
    
    // Test dropdown Solutions
    await page.getByTestId('nav-dropdown-solutions').click();
    await expect(page.locator('text=E-commerce')).toBeVisible();
    await expect(page.locator('text=Marketing')).toBeVisible();
  });

  test('should navigate through all main pages', async ({ page }) => {
    const pages = [
      { url: '/', title: 'Luneo' },
      { url: '/features', title: 'Fonctionnalités' },
      { url: '/pricing', title: 'Tarifs' },
      { url: '/about', title: 'À propos' },
      { url: '/contact', title: 'Contact' },
      { url: '/help/documentation', title: 'Documentation' },
    ];

    for (const p of pages) {
      await page.goto(p.url);
      await expect(page).toHaveURL(p.url);
      // Vérifier que la page charge sans erreur
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should navigate to all new pages created', async ({ page }) => {
    const newPages = [
      '/enterprise',
      '/status',
      '/changelog',
      '/partners',
      '/affiliate',
      '/legal/cookies',
      '/legal/gdpr',
      '/legal/dpa',
      '/help/documentation/quickstart',
      '/help/documentation/authentication',
      '/integrations/shopify',
      '/templates',
      '/blog',
      '/roadmap',
    ];

    for (const url of newPages) {
      await page.goto(url);
      await expect(page).toHaveURL(url);
      // Vérifier pas de 404
      await expect(page.locator('text=404')).not.toBeVisible();
    }
  });

  test('should have working mobile menu', async ({ page }) => {
    // Réduire la taille de la fenêtre
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Ouvrir menu mobile
    await page.getByTestId('mobile-menu-button').click();
    
    // Vérifier que le menu est visible
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
    
    // Cliquer sur un lien
    await page.click('text=Fonctionnalités');
    await expect(page).toHaveURL('/features');
  });
});



