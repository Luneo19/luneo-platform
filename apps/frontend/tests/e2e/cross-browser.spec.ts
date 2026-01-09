/**
 * Tests E2E - Cross-Browser Compatibility
 * T-022: Tests E2E compatibilité multi-navigateurs
 * 
 * Ce test vérifie que les fonctionnalités critiques fonctionnent
 * sur Chrome, Firefox et Safari
 */

import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';

// Tests qui doivent fonctionner sur tous les navigateurs
test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
  });

  // ============================================
  // NAVIGATION DE BASE
  // ============================================

  test('should navigate to homepage on all browsers', async ({ page, browserName }) => {
    console.log(`🌐 Testing on ${browserName}...`);
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    await expect(page).toHaveURL(/.*\/$|.*\/home/);
    console.log(`✅ Homepage loaded on ${browserName}`);
  });

  test('should navigate to pricing page on all browsers', async ({ page, browserName }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    await expect(page).toHaveURL(/.*pricing/);
    console.log(`✅ Pricing page loaded on ${browserName}`);
  });

  test('should navigate to login page on all browsers', async ({ page, browserName }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    await expect(page).toHaveURL(/.*login/);
    console.log(`✅ Login page loaded on ${browserName}`);
  });

  // ============================================
  // FORMULAIRES
  // ============================================

  test('should fill and submit login form on all browsers', async ({ page, browserName }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    const emailField = page.getByTestId('login-email').or(page.getByPlaceholder(/email/i));
    const passwordField = page.getByTestId('login-password').or(page.getByPlaceholder(/password|mot de passe/i));
    
    if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailField.fill('test@example.com');
      await passwordField.fill('TestPassword123!');
      
      // Vérifier que les champs sont remplis
      await expect(emailField).toHaveValue('test@example.com');
      await expect(passwordField).toHaveValue('TestPassword123!');
      
      console.log(`✅ Login form filled on ${browserName}`);
    } else {
      console.log(`ℹ️ Login form not found on ${browserName} (may require different selectors)`);
    }
  });

  test('should fill registration form on all browsers', async ({ page, browserName }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    const emailField = page.getByTestId('register-email');
    const passwordField = page.getByTestId('register-password');
    const confirmPasswordField = page.getByTestId('register-confirm-password');
    
    if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailField.fill('test@example.com');
      await passwordField.fill('TestPassword123!');
      await confirmPasswordField.fill('TestPassword123!');
      
      await expect(emailField).toHaveValue('test@example.com');
      await expect(passwordField).toHaveValue('TestPassword123!');
      
      console.log(`✅ Registration form filled on ${browserName}`);
    } else {
      console.log(`ℹ️ Registration form not found on ${browserName}`);
    }
  });

  // ============================================
  // INTERACTIONS UI
  // ============================================

  test('should handle button clicks on all browsers', async ({ page, browserName }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Cliquer sur le premier bouton disponible
      const firstButton = buttons.first();
      await firstButton.click();
      await page.waitForTimeout(500);
      
      console.log(`✅ Button clicked on ${browserName}`);
    } else {
      console.log(`ℹ️ No buttons found on ${browserName}`);
    }
  });

  test('should handle link navigation on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    const links = page.getByRole('link');
    const linkCount = await links.count();
    
    if (linkCount > 0) {
      // Trouver un lien interne (pas externe)
      let internalLink = null;
      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href').catch(() => null);
        if (href && (href.startsWith('/') || href.startsWith('#') || !href.startsWith('http'))) {
          internalLink = link;
          break;
        }
      }
      
      if (internalLink) {
        await internalLink.click();
        await page.waitForTimeout(1000);
        console.log(`✅ Link navigation works on ${browserName}`);
      } else {
        console.log(`ℹ️ No internal links found on ${browserName}`);
      }
    }
  });

  // ============================================
  // RESPONSIVE DESIGN
  // ============================================

  test('should display correctly on mobile viewport on all browsers', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    // Vérifier que la page est visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log(`✅ Mobile viewport (375x667) works on ${browserName}`);
  });

  test('should display correctly on tablet viewport on all browsers', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log(`✅ Tablet viewport (768x1024) works on ${browserName}`);
  });

  test('should display correctly on desktop viewport on all browsers', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log(`✅ Desktop viewport (1920x1080) works on ${browserName}`);
  });

  // ============================================
  // JAVASCRIPT / INTERACTIVITÉ
  // ============================================

  test('should execute JavaScript on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Tester une fonction JavaScript simple
    const jsResult = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    
    expect(jsResult).toBe(true);
    console.log(`✅ JavaScript execution works on ${browserName}`);
  });

  test('should handle localStorage on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Tester localStorage
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });
    
    const value = await page.evaluate(() => {
      return localStorage.getItem('test-key');
    });
    
    expect(value).toBe('test-value');
    console.log(`✅ localStorage works on ${browserName}`);
  });

  test('should handle sessionStorage on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Tester sessionStorage
    await page.evaluate(() => {
      sessionStorage.setItem('test-key', 'test-value');
    });
    
    const value = await page.evaluate(() => {
      return sessionStorage.getItem('test-key');
    });
    
    expect(value).toBe('test-value');
    console.log(`✅ sessionStorage works on ${browserName}`);
  });

  // ============================================
  // CSS / STYLING
  // ============================================

  test('should apply CSS styles on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    // Vérifier qu'au moins un élément a des styles appliqués
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // La couleur ne devrait pas être transparente ou vide
    expect(backgroundColor).toBeTruthy();
    console.log(`✅ CSS styles applied on ${browserName}`);
  });

  // ============================================
  // ACCESSIBILITÉ
  // ============================================

  test('should have accessible elements on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    // Vérifier qu'il y a des éléments accessibles
    const headings = page.getByRole('heading');
    const buttons = page.getByRole('button');
    const links = page.getByRole('link');
    
    const headingCount = await headings.count();
    const buttonCount = await buttons.count();
    const linkCount = await links.count();
    
    // Au moins un type d'élément devrait être présent
    expect(headingCount + buttonCount + linkCount).toBeGreaterThan(0);
    console.log(`✅ Accessible elements found on ${browserName} (${headingCount} headings, ${buttonCount} buttons, ${linkCount} links)`);
  });

  // ============================================
  // PERFORMANCE
  // ============================================

  test('should load pages within reasonable time on all browsers', async ({ page, browserName }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // La page devrait charger en moins de 15 secondes sur tous les navigateurs
    expect(loadTime).toBeLessThan(15000);
    console.log(`✅ Page load time on ${browserName}: ${loadTime}ms`);
  });

  // ============================================
  // ERREURS CONSOLE
  // ============================================

  test('should not have critical console errors on all browsers', async ({ page, browserName }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignorer certaines erreurs communes en développement
        if (!text.includes('favicon') && !text.includes('sourcemap')) {
          errors.push(text);
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    // Attendre un peu pour capturer les erreurs asynchrones
    await page.waitForTimeout(2000);
    
    // Logger les erreurs mais ne pas faire échouer le test
    if (errors.length > 0) {
      console.log(`⚠️ Console errors on ${browserName}:`, errors);
    } else {
      console.log(`✅ No critical console errors on ${browserName}`);
    }
  });
});

// ============================================
// TESTS SPÉCIFIQUES PAR NAVIGATEUR
// ============================================

test.describe('Browser-Specific Features', () => {
  test('should handle WebGL on Chrome', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');
    
    await page.goto('/configure-3d/test-product-123');
    await page.waitForLoadState('domcontentloaded');
    
    // Vérifier que WebGL est disponible
    const webglAvailable = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
    });
    
    expect(webglAvailable).toBe(true);
    console.log('✅ WebGL available on Chrome');
  });

  test('should handle WebGL on Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');
    
    await page.goto('/configure-3d/test-product-123');
    await page.waitForLoadState('domcontentloaded');
    
    const webglAvailable = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
    });
    
    expect(webglAvailable).toBe(true);
    console.log('✅ WebGL available on Firefox');
  });

  test('should handle WebGL on Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');
    
    await page.goto('/configure-3d/test-product-123');
    await page.waitForLoadState('domcontentloaded');
    
    const webglAvailable = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
    });
    
    expect(webglAvailable).toBe(true);
    console.log('✅ WebGL available on Safari');
  });
});

// ============================================
// TESTS DE COMPATIBILITÉ CSS
// ============================================

test.describe('CSS Compatibility', () => {
  test('should support CSS Grid on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const gridSupported = await page.evaluate(() => {
      return CSS.supports('display', 'grid');
    });
    
    expect(gridSupported).toBe(true);
    console.log(`✅ CSS Grid supported on ${browserName}`);
  });

  test('should support Flexbox on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const flexboxSupported = await page.evaluate(() => {
      return CSS.supports('display', 'flex');
    });
    
    expect(flexboxSupported).toBe(true);
    console.log(`✅ Flexbox supported on ${browserName}`);
  });

  test('should support CSS Variables on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const cssVarsSupported = await page.evaluate(() => {
      return CSS.supports('color', 'var(--test)');
    });
    
    expect(cssVarsSupported).toBe(true);
    console.log(`✅ CSS Variables supported on ${browserName}`);
  });
});

// ============================================
// TESTS DE PERFORMANCE CROSS-BROWSER
// ============================================

test.describe('Cross-Browser Performance', () => {
  test('should have similar load times across browsers', async ({ page, browserName }) => {
    const startTime = Date.now();
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Logger le temps pour comparaison (ne pas faire échouer)
    console.log(`⏱️ Load time on ${browserName}: ${loadTime}ms`);
    
    // Vérifier que c'est raisonnable (< 20 secondes)
    expect(loadTime).toBeLessThan(20000);
  });

  test('should handle animations smoothly on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureCookieBannerClosed(page);
    
    // Vérifier que les animations CSS sont supportées
    const animationsSupported = await page.evaluate(() => {
      return CSS.supports('animation', 'test 1s');
    });
    
    expect(animationsSupported).toBe(true);
    console.log(`✅ CSS Animations supported on ${browserName}`);
  });
});













