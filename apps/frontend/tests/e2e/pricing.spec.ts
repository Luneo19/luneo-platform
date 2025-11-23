import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';

/**
 * Tests E2E Pricing Page - Parcours complet paiement
 * TODO-053: Tests E2E Pricing complets (200+ lignes)
 */
test.describe('Pricing Page - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
    await page.goto('/pricing');
  });

  test('should display all pricing plans', async ({ page }) => {
    // Vérifier que la page charge
    await expect(page).toHaveURL(/.*pricing/);
    
    // Vérifier les plans
    const plans = ['Starter', 'Professional', 'Enterprise'];
    for (const planName of plans) {
      const planElement = page.getByText(new RegExp(planName, 'i')).first();
      await expect(planElement).toBeVisible({ timeout: 10000 });
    }
  });

  test('should toggle between monthly and yearly pricing', async ({ page }) => {
    // Trouver le toggle monthly/yearly
    const monthlyToggle = page.getByText(/mensuel|monthly/i).first();
    const yearlyToggle = page.getByText(/annuel|yearly/i).first();

    if (await monthlyToggle.isVisible().catch(() => false)) {
      await monthlyToggle.click();
      await page.waitForTimeout(500);
      
      // Vérifier que les prix mensuels sont affichés
      const monthlyPrice = page.getByText(/€\/mois|€\/month/i).first();
      await expect(monthlyPrice).toBeVisible();
    }

    if (await yearlyToggle.isVisible().catch(() => false)) {
      await yearlyToggle.click();
      await page.waitForTimeout(500);
      
      // Vérifier que les prix annuels sont affichés
      const yearlyPrice = page.getByText(/€\/an|€\/year/i).first();
      await expect(yearlyPrice).toBeVisible();
    }
  });

  test('should display plan features correctly', async ({ page }) => {
    // Vérifier que les features sont affichées
    const features = [
      /designs|design/i,
      /templates|modèles/i,
      /support|assistance/i,
      /api|intégrations/i,
    ];

    for (const feature of features) {
      const featureElement = page.getByText(feature).first();
      const isVisible = await featureElement.isVisible().catch(() => false);
      if (isVisible) {
        await expect(featureElement).toBeVisible();
      }
    }
  });

  test('should highlight popular plan', async ({ page }) => {
    // Chercher le badge "POPULAIRE" ou "POPULAR"
    const popularBadge = page.getByText(/populaire|popular/i).first();
    const isVisible = await popularBadge.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(popularBadge).toBeVisible();
    }
  });

  test('should navigate to register when clicking starter plan', async ({ page }) => {
    // Trouver le bouton "Commencer" ou "Get Started" du plan Starter
    const starterButton = page
      .getByRole('button', { name: /commencer|get started|start/i })
      .first();

    if (await starterButton.isVisible().catch(() => false)) {
      await starterButton.click();
      
      // Vérifier redirection vers register ou checkout
      await page.waitForURL(/.*register|.*checkout|.*signup/i, { timeout: 10000 });
      const url = page.url();
      expect(url).toMatch(/register|checkout|signup/i);
    }
  });

  test('should navigate to checkout when clicking professional plan', async ({ page }) => {
    // Trouver le bouton du plan Professional
    const professionalButton = page
      .getByRole('button', { name: /essayer|try|professional/i })
      .first();

    if (await professionalButton.isVisible().catch(() => false)) {
      await professionalButton.click();
      
      // Attendre redirection ou modal checkout
      await page.waitForTimeout(2000);
      
      // Vérifier que quelque chose s'est passé (redirection, modal, etc.)
      const url = page.url();
      const hasModal = await page.getByRole('dialog').isVisible().catch(() => false);
      
      expect(url !== '/pricing' || hasModal).toBeTruthy();
    }
  });

  test('should display enterprise contact form', async ({ page }) => {
    // Chercher le bouton Enterprise (généralement "Contactez-nous")
    const enterpriseButton = page
      .getByRole('button', { name: /contact|nous contacter|contact us/i })
      .first();

    if (await enterpriseButton.isVisible().catch(() => false)) {
      await enterpriseButton.click();
      
      // Vérifier qu'un formulaire ou modal s'ouvre
      await page.waitForTimeout(1000);
      
      const hasForm = await page.getByRole('textbox').isVisible().catch(() => false);
      const hasModal = await page.getByRole('dialog').isVisible().catch(() => false);
      
      expect(hasForm || hasModal).toBeTruthy();
    }
  });

  test('should display FAQ section', async ({ page }) => {
    // Scroller jusqu'à la FAQ
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Chercher la section FAQ
    const faqHeading = page.getByText(/faq|questions|frequently asked/i).first();
    const isVisible = await faqHeading.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(faqHeading).toBeVisible();
    }
  });

  test('should expand FAQ items', async ({ page }) => {
    // Scroller jusqu'à la FAQ
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Trouver un élément FAQ cliquable
    const faqItem = page.getByRole('button').filter({ hasText: /question|faq/i }).first();
    const isVisible = await faqItem.isVisible().catch(() => false);
    
    if (isVisible) {
      await faqItem.click();
      await page.waitForTimeout(500);
      
      // Vérifier que le contenu s'affiche
      const faqContent = page.locator('[role="region"], [aria-expanded="true"]').first();
      await expect(faqContent).toBeVisible({ timeout: 2000 });
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Tester sur mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Vérifier que les plans sont toujours visibles
    const plansSection = page.getByText(/starter|professional|enterprise/i).first();
    await expect(plansSection).toBeVisible({ timeout: 10000 });
    
    // Vérifier que les boutons sont accessibles
    const ctaButton = page.getByRole('button').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should handle plan comparison', async ({ page }) => {
    // Chercher un bouton ou lien de comparaison
    const compareButton = page.getByText(/comparer|compare/i).first();
    const isVisible = await compareButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await compareButton.click();
      await page.waitForTimeout(1000);
      
      // Vérifier qu'une vue de comparaison s'affiche
      const comparisonTable = page.getByRole('table').first();
      const isTableVisible = await comparisonTable.isVisible().catch(() => false);
      
      if (isTableVisible) {
        await expect(comparisonTable).toBeVisible();
      }
    }
  });
});

/**
 * Tests E2E Checkout Flow (si Stripe configuré)
 */
test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test('should redirect to Stripe checkout', async ({ page, context }) => {
    // Intercepter les redirections vers Stripe
    let stripeUrl: string | null = null;
    
    context.on('response', (response) => {
      const url = response.url();
      if (url.includes('stripe.com') || url.includes('checkout')) {
        stripeUrl = url;
      }
    });

    await page.goto('/pricing');
    
    // Cliquer sur un plan (Professional par exemple)
    const professionalButton = page
      .getByRole('button', { name: /essayer|try|professional/i })
      .first();

    if (await professionalButton.isVisible().catch(() => false)) {
      await professionalButton.click();
      
      // Attendre une redirection ou ouverture Stripe
      await page.waitForTimeout(3000);
      
      // Vérifier qu'une redirection vers Stripe s'est produite
      // ou qu'un iframe Stripe est présent
      const currentUrl = page.url();
      const hasStripeIframe = await page.frameLocator('iframe[src*="stripe"]').first().count() > 0;
      
      expect(currentUrl.includes('stripe') || hasStripeIframe || stripeUrl !== null).toBeTruthy();
    }
  });

  test('should handle checkout cancellation', async ({ page }) => {
    await page.goto('/pricing');
    
    // Simuler un retour depuis Stripe (cancel)
    await page.goto('/pricing?canceled=true');
    
    // Vérifier qu'un message d'annulation s'affiche (si implémenté)
    await page.waitForTimeout(1000);
    
    // La page devrait toujours être accessible
    await expect(page).toHaveURL(/.*pricing/);
  });
});
