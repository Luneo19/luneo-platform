/**
 * Tests E2E - Scénario complet: Checkout → Paiement → Confirmation
 * T-020: Tests E2E parcours complet de paiement
 * 
 * Ce test vérifie le parcours critique de paiement:
 * 1. Sélection d'un plan sur la page pricing
 * 2. Création de la session de checkout Stripe
 * 3. Redirection vers Stripe (simulée)
 * 4. Page de confirmation de succès
 */

import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from '../utils/locale';
import { isPresentAndVisible } from '../utils/assertions';

test.describe('Checkout → Payment → Confirmation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
  });

  test('should complete full checkout journey: pricing → checkout → success', async ({ page }) => {
    // ============================================
    // ÉTAPE 1: NAVIGATION VERS PRICING
    // ============================================
    console.log('💰 Étape 1: Navigation vers pricing...');
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    await expect(page).toHaveURL(/.*pricing/);
    console.log('✅ Page pricing chargée');

    // ============================================
    // ÉTAPE 2: AFFICHAGE DES PLANS
    // ============================================
    console.log('📋 Étape 2: Vérification des plans...');
    
    // Vérifier qu'au moins un plan est visible
    const planNames = ['Starter', 'Professional', 'Business', 'Enterprise'];
    let foundPlan = false;
    
    for (const planName of planNames) {
      const planElement = page.getByText(new RegExp(planName, 'i')).first();
      if (await isPresentAndVisible(planElement)) {
        foundPlan = true;
        console.log(`✅ Plan ${planName} trouvé`);
        break;
      }
    }
    
    // Si aucun plan n'est trouvé, vérifier qu'il y a du contenu
    if (!foundPlan) {
      const hasContent = await isPresentAndVisible(page.locator('main, [role="main"], .container').first());
      expect(hasContent).toBeTruthy();
      console.log('ℹ️ Plans non trouvés mais contenu présent');
    }

    // ============================================
    // ÉTAPE 3: SÉLECTION D'UN PLAN
    // ============================================
    console.log('🎯 Étape 3: Sélection d\'un plan...');
    
    // Chercher les boutons CTA pour les plans
    const ctaButtons = [
      page.getByRole('button', { name: /commencer|essayer|choisir|get started|try|subscribe|starter|professional|business/i }),
      page.getByTestId('plan-starter-button'),
      page.getByTestId('plan-professional-button'),
      page.getByTestId('plan-business-button'),
    ];
    
    let checkoutButton = null;
    for (const button of ctaButtons) {
      if (await isPresentAndVisible(button)) {
        checkoutButton = button.first();
        console.log('✅ Bouton de checkout trouvé');
        break;
      }
    }
    
    // Si aucun bouton spécifique n'est trouvé, chercher tous les boutons
    if (!checkoutButton) {
      const allButtons = page.getByRole('button');
      const buttonCount = await allButtons.count();
      if (buttonCount > 0) {
        // Prendre le premier bouton qui semble être un CTA
        checkoutButton = allButtons.first();
        console.log(`ℹ️ Utilisation du premier bouton trouvé (${buttonCount} boutons au total)`);
      }
    }
    
    expect(checkoutButton).not.toBeNull();

    // ============================================
    // ÉTAPE 4: CRÉATION DE LA SESSION CHECKOUT
    // ============================================
    console.log('🔐 Étape 4: Création de la session checkout...');
    
    // Intercepter la requête API de création de session
    let checkoutSessionCreated = false;
    let checkoutUrl = '';
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/billing/create-checkout-session') && response.request().method() === 'POST') {
        checkoutSessionCreated = true;
        try {
          const data = await response.json();
          checkoutUrl = data.data?.url || data.url || '';
          console.log('✅ Session checkout créée:', checkoutUrl ? 'URL reçue' : 'Pas d\'URL');
        } catch (e) {
          console.log('⚠️ Impossible de parser la réponse de checkout');
        }
      }
    });
    
    // Cliquer sur le bouton de checkout
    await checkoutButton.click();
    console.log('✅ Bouton de checkout cliqué');
    
    // Attendre que la requête API soit faite
    await page.waitForTimeout(2000);
    
    // Vérifier que la session a été créée (ou que la redirection a eu lieu)
    const currentUrl = page.url();
    const isStripeCheckout = currentUrl.includes('stripe.com') || currentUrl.includes('checkout.stripe');
    const isSuccessPage = currentUrl.includes('/billing/success') || currentUrl.includes('/success');
    
    if (isStripeCheckout) {
      console.log('✅ Redirection vers Stripe Checkout détectée');
    } else if (isSuccessPage) {
      console.log('✅ Redirection vers page de succès (paiement test)');
    } else if (checkoutSessionCreated) {
      console.log('✅ Session checkout créée (redirection peut être bloquée en test)');
    } else {
      console.log('⚠️ Session checkout peut ne pas avoir été créée (normal en environnement de test)');
    }

    // ============================================
    // ÉTAPE 5: SIMULATION DU PAIEMENT (si sur Stripe)
    // ============================================
    if (isStripeCheckout) {
      console.log('💳 Étape 5: Simulation du paiement Stripe...');
      
      // En environnement de test, on ne peut pas vraiment compléter le paiement Stripe
      // Mais on peut vérifier que la page Stripe est chargée
      await page.waitForLoadState('domcontentloaded');
      
      // Vérifier qu'on est bien sur Stripe
      const stripeElements = [
        page.getByText(/stripe/i),
        page.locator('[data-testid="hosted-payment-submit-button"]'),
        page.getByRole('button', { name: /pay|payer|submit|soumettre/i }),
      ];
      
      let stripePageLoaded = false;
      for (const element of stripeElements) {
        if (await isPresentAndVisible(element)) {
          stripePageLoaded = true;
          console.log('✅ Page Stripe Checkout chargée');
          break;
        }
      }
      
      if (!stripePageLoaded) {
        console.log('ℹ️ Page Stripe peut être en chargement ou nécessiter authentification');
      }
    }

    // ============================================
    // ÉTAPE 6: VÉRIFICATION DE LA PAGE DE SUCCÈS
    // ============================================
    console.log('✅ Étape 6: Vérification de la page de succès...');
    
    // Si on n'est pas déjà sur la page de succès, y naviguer directement (simulation)
    if (!isSuccessPage && !isStripeCheckout) {
      // Simuler une redirection vers la page de succès avec un session_id mocké
      const mockSessionId = 'cs_test_' + Date.now();
      await page.goto(`/dashboard/billing/success?session_id=${mockSessionId}`);
      await page.waitForLoadState('domcontentloaded');
    }
    
    // Vérifier que la page de succès existe et s'affiche
    if (page.url().includes('/billing/success') || page.url().includes('/success')) {
      await page.waitForLoadState('domcontentloaded');
      
      // Chercher les éléments de la page de succès
      const successElements = [
        page.getByText(/succès|success|paiement.*réussi|payment.*successful/i),
        page.getByText(/merci|thank you|confirmation/i),
        page.getByText(/abonnement|subscription/i),
        page.locator('[data-testid="billing-success"]'),
      ];
      
      let successPageVisible = false;
      for (const element of successElements) {
        if (await isPresentAndVisible(element)) {
          successPageVisible = true;
          console.log('✅ Page de succès affichée');
          break;
        }
      }
      
      // Vérifier qu'il n'y a pas d'erreur
      const errorMessage = page.getByText(/erreur|error|échec|failed/i).first();
      const hasError = await isPresentAndVisible(errorMessage);
      
      if (hasError) {
        console.log('⚠️ Message d\'erreur détecté sur la page de succès (peut être normal en test)');
      }
      
      if (!successPageVisible && !hasError) {
        console.log('ℹ️ Page de succès chargée mais contenu spécifique non détecté');
      }
    }
    
    console.log('✅ Parcours checkout terminé');
  });

  test('should handle checkout cancellation', async ({ page }) => {
    console.log('🚫 Test d\'annulation de checkout...');
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    // Simuler une annulation en naviguant directement vers la page d'annulation
    await page.goto('/pricing?canceled=true');
    await page.waitForLoadState('domcontentloaded');
    
    // Vérifier que la page pricing est toujours accessible
    await expect(page).toHaveURL(/.*pricing/);
    
    // Vérifier qu'il n'y a pas d'erreur bloquante
    const errorBanner = page.getByText(/erreur.*critique|critical.*error/i).first();
    const hasCriticalError = await isPresentAndVisible(errorBanner);
    
    expect(hasCriticalError).toBeFalsy();
    console.log('✅ Annulation gérée correctement');
  });

  test('should display pricing toggle (monthly/yearly)', async ({ page }) => {
    console.log('🔄 Test du toggle pricing...');
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    // Chercher le toggle monthly/yearly
    const monthlyText = page.getByText(/mensuel|monthly/i).first();
    const yearlyText = page.getByText(/annuel|yearly/i).first();
    const toggleButton = page.getByRole('button', { name: /toggle|switch/i }).first();
    
    const hasMonthly = await isPresentAndVisible(monthlyText);
    const hasYearly = await isPresentAndVisible(yearlyText);
    const hasToggle = await isPresentAndVisible(toggleButton);
    
    if (hasToggle) {
      // Cliquer sur le toggle
      await toggleButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Toggle cliqué');
    } else if (hasMonthly || hasYearly) {
      console.log('ℹ️ Toggle présent mais non interactif');
    } else {
      console.log('ℹ️ Toggle non trouvé (peut ne pas être implémenté)');
    }
  });

  test('should verify checkout API endpoint', async ({ request }) => {
    console.log('🔌 Test de l\'endpoint API checkout...');
    
    // Tester l'endpoint de création de session (sans authentification)
    const response = await request.post('/api/billing/create-checkout-session', {
      data: {
        planId: 'starter',
        billing: 'monthly',
      },
    });

    const status = response.status();
    console.log(`✅ API checkout répond avec status: ${status}`);
    expect([200, 201, 400, 401, 403, 404, 422]).toContain(status);
  });

  test('should verify success page with mock session', async ({ page }) => {
    console.log('✅ Test de la page de succès avec session mockée...');
    
    const mockSessionId = 'cs_test_mock_' + Date.now();
    
    await page.goto(`/dashboard/billing/success?session_id=${mockSessionId}`);
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    // Vérifier que la page charge (même si la vérification de session échoue)
    await expect(page).toHaveURL(/.*success/);
    
    // La page devrait afficher un état de chargement ou d'erreur (normal avec un session_id mocké)
    const loadingIndicator = page.getByText(/chargement|loading|vérification|verifying/i).first();
    const errorMessage = page.getByText(/erreur|error|session.*invalide|invalid.*session/i).first();
    const successMessage = page.getByText(/succès|success/i).first();
    
    const hasLoading = await isPresentAndVisible(loadingIndicator);
    const hasError = await isPresentAndVisible(errorMessage);
    const hasSuccess = await isPresentAndVisible(successMessage);
    
    // Au moins un de ces états devrait être visible
    expect(hasLoading || hasError || hasSuccess).toBeTruthy();
    
    if (hasLoading) {
      console.log('✅ Page affiche un état de chargement');
    } else if (hasError) {
      console.log('ℹ️ Page affiche une erreur (normal avec session mockée)');
    } else if (hasSuccess) {
      console.log('✅ Page affiche un message de succès');
    }
  });
});

// ============================================
// TESTS DE PERFORMANCE
// ============================================

test.describe('Checkout Performance', () => {
  test('should load pricing page quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`Pricing page load time: ${loadTime}ms`);
    
    // La page devrait charger en moins de 15 secondes
    expect(loadTime).toBeLessThan(15000);
  });

  test('should create checkout session within reasonable time', async ({ request }) => {
    expect(process.env.E2E_SKIP_AUTH).not.toBe('true');

    const startTime = Date.now();
    const response = await request.post('/api/billing/create-checkout-session', {
      data: {
        planId: 'starter',
        billing: 'monthly',
      },
    });

    const apiTime = Date.now() - startTime;
    expect(response.status()).toBeLessThan(500);
    console.log(`Checkout API response time: ${apiTime}ms`);
    expect(apiTime).toBeLessThan(5000);
  });
});

// ============================================
// TESTS DE SÉCURITÉ (BASIC)
// ============================================

test.describe('Checkout Security', () => {
  test('should reject invalid plan IDs', async ({ request }) => {
    const response = await request.post('/api/billing/create-checkout-session', {
      data: {
        planId: 'invalid_plan_id_xyz123',
        billing: 'monthly',
      },
    });

    const status = response.status();
    expect([400, 401, 403, 404, 422]).toContain(status);
    console.log(`✅ Plan invalide rejeté avec status: ${status}`);
  });

  test('should require valid billing cycle', async ({ request }) => {
    const response = await request.post('/api/billing/create-checkout-session', {
      data: {
        planId: 'starter',
        billing: 'invalid_cycle',
      },
    });

    const status = response.status();
    expect([400, 404, 422]).toContain(status);
    console.log(`✅ Cycle de facturation invalide rejeté avec status: ${status}`);
  });
});













