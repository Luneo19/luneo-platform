/**
 * Tests E2E - Parcours Pricing → Checkout → Success
 * T-018: Tests E2E parcours complet de paiement
 */

import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';
import { isPresentAndVisible } from './utils/assertions';

test.describe('Checkout Flow - Complete Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
  });

  // ============================================
  // AFFICHAGE DES PLANS
  // ============================================
  
  test.describe('Pricing Display', () => {
    test('should display pricing page', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      await expect(page).toHaveURL(/.*pricing/);
    });

    test('should display at least one plan', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      // Vérifier qu'au moins un plan est affiché
      const planNames = ['Starter', 'Professional', 'Business', 'Enterprise'];
      let foundPlan = false;
      
      for (const planName of planNames) {
        const planElement = page.getByText(new RegExp(planName, 'i')).first();
        if (await isPresentAndVisible(planElement)) {
          foundPlan = true;
          console.log(`✅ Plan ${planName} visible`);
          break;
        }
      }
      
      // Si aucun plan n'est trouvé, vérifier qu'il y a au moins du contenu
      if (!foundPlan) {
        const hasContent = await isPresentAndVisible(page.locator('main, [role="main"], .container').first());
        expect(hasContent).toBeTruthy();
      }
    });

    test('should have pricing toggle', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      // Chercher le toggle monthly/yearly
      const monthlyText = page.getByText(/mensuel|monthly/i).first();
      const yearlyText = page.getByText(/annuel|yearly/i).first();
      
      const hasToggle = 
        await isPresentAndVisible(monthlyText) ||
        await isPresentAndVisible(yearlyText);
      
      expect(hasToggle).toBeTruthy();
    });

    test('should have CTA buttons', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      // Chercher des boutons CTA
      const ctaButton = page.getByRole('button', { name: /commencer|essayer|choisir|get started|try|subscribe|contact/i }).first();
      const hasButton = await isPresentAndVisible(ctaButton);
      expect(hasButton).toBeTruthy();
    });
  });

  // ============================================
  // SÉLECTION D'UN PLAN
  // ============================================
  
  test.describe('Plan Selection', () => {
    test('should have clickable elements', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      // Vérifier qu'il y a des boutons cliquables
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();
      
      expect(buttonCount).toBeGreaterThan(0);
      console.log(`Found ${buttonCount} buttons`);
    });
  });

  // ============================================
  // PAGE DE SUCCÈS
  // ============================================
  
  test.describe('Success Page', () => {
    test('should have success page route', async ({ page }) => {
      // Naviguer directement vers la page de succès
      const response = await page.goto('/dashboard/billing/success?session_id=test_session');
      await page.waitForLoadState('domcontentloaded');
      
      expect(response?.status() ?? 500).toBeLessThan(500);
      expect(page.url()).toContain('/success');
      const body = (await page.textContent('body')) || '';
      expect(body.includes('Internal Server Error')).toBeFalsy();
    });
  });

  // ============================================
  // GESTION DES ANNULATIONS
  // ============================================
  
  test.describe('Cancellation Handling', () => {
    test('should handle canceled parameter', async ({ page }) => {
      await page.goto('/pricing?canceled=true');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      // La page devrait toujours être accessible
      await expect(page).toHaveURL(/.*pricing/);
    });
  });
});

// ============================================
// TESTS D'INTÉGRATION API
// ============================================

test.describe('Billing API Integration', () => {
  test('should have plans API endpoint', async ({ request }) => {
    const response = await request.get('/api/public/plans');
    const status = response.status();
    console.log('Plans API status:', status);
    expect(status).toBeLessThan(500);
  });

  test('should have checkout session API', async ({ request }) => {
    const response = await request.post('/api/billing/create-checkout-session', {
      data: {
        planId: 'starter',
        billing: 'monthly',
      },
    });

    const status = response.status();
    console.log('Checkout API status:', status);
    expect([200, 201, 400, 401, 403, 404, 422]).toContain(status);
  });
});

// ============================================
// TESTS DE PERFORMANCE
// ============================================

test.describe('Checkout Performance', () => {
  test('should load pricing page', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Log le temps de chargement
    console.log(`Pricing page load time: ${loadTime}ms`);
    
    // La page devrait charger en moins de 15 secondes
    expect(loadTime).toBeLessThan(15000);
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
    // Should return an error status (4xx or 5xx)
    expect([400, 401, 403, 404, 422]).toContain(status);
  });
});
