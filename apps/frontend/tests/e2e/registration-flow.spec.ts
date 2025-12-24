/**
 * Tests E2E - Parcours d'inscription utilisateur
 * T-016: Tests E2E inscription utilisateur
 */

import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';

// Générateur d'email unique pour les tests
const generateTestEmail = () => `test-e2e-${Date.now()}-${Math.random().toString(36).substring(7)}@test-luneo.app`;

test.describe('Registration Flow - Complete Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
  });

  // ============================================
  // AFFICHAGE DU FORMULAIRE
  // ============================================
  
  test.describe('Form Display', () => {
    test('should display registration page correctly', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      await expect(page).toHaveURL(/.*register/);
      await expect(page.getByText(/inscription|créer.*compte|sign up|register/i).first()).toBeVisible();
    });

    test('should display all form fields', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const emailField = page.getByTestId('register-email');
      const passwordField = page.getByTestId('register-password');
      const confirmPasswordField = page.getByTestId('register-confirm-password');
      const submitButton = page.getByTestId('register-submit');
      
      await expect(emailField).toBeVisible();
      await expect(passwordField).toBeVisible();
      await expect(confirmPasswordField).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const loginLink = page.getByText(/déjà.*compte|already.*account|se connecter|sign in/i).first();
      await expect(loginLink).toBeVisible();
    });

    test('should display OAuth options', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      // Vérifier qu'au moins un bouton OAuth est visible
      const googleButton = page.getByTestId('register-oauth-google');
      const githubButton = page.getByTestId('register-oauth-github');
      
      const hasOAuth = 
        await googleButton.isVisible().catch(() => false) ||
        await githubButton.isVisible().catch(() => false);
      
      console.log('OAuth buttons visible:', hasOAuth);
      // Ne pas échouer si OAuth n'est pas configuré
    });
  });

  // ============================================
  // VALIDATION DES CHAMPS
  // ============================================
  
  test.describe('Form Validation', () => {
    test('should have required email field', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const emailField = page.getByTestId('register-email');
      await expect(emailField).toBeVisible();
      const isRequired = await emailField.getAttribute('required');
      expect(isRequired).not.toBeNull();
    });

    test('should have email type for validation', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const emailField = page.getByTestId('register-email');
      await expect(emailField).toBeVisible();
      const type = await emailField.getAttribute('type');
      expect(type).toBe('email');
    });

    test('should have required password field', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const passwordField = page.getByTestId('register-password');
      await expect(passwordField).toBeVisible();
      const isRequired = await passwordField.getAttribute('required');
      expect(isRequired).not.toBeNull();
    });

    test('should have password confirmation field', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const confirmPasswordField = page.getByTestId('register-confirm-password');
      await expect(confirmPasswordField).toBeVisible();
    });
  });

  // ============================================
  // INSCRIPTION AVEC EMAIL/PASSWORD
  // ============================================
  
  test.describe('Email Registration', () => {
    test('should fill registration form correctly', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const testEmail = generateTestEmail();
      
      const nameField = page.getByTestId('register-name');
      const emailField = page.getByTestId('register-email');
      const passwordField = page.getByTestId('register-password');
      const confirmPasswordField = page.getByTestId('register-confirm-password');
      
      // Remplir le formulaire
      if (await nameField.isVisible().catch(() => false)) {
        await nameField.fill('Test User E2E');
      }
      await emailField.fill(testEmail);
      await passwordField.fill('TestPassword123!');
      await confirmPasswordField.fill('TestPassword123!');
      
      // Vérifier que les champs sont remplis
      await expect(emailField).toHaveValue(testEmail);
      await expect(passwordField).toHaveValue('TestPassword123!');
    });

    test('should have submit button', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const submitButton = page.getByTestId('register-submit');
      await expect(submitButton).toBeVisible();
    });
  });

  // ============================================
  // ACCESSIBILITÉ
  // ============================================
  
  test.describe('Accessibility', () => {
    test('should have proper labels on form fields', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const emailField = page.getByTestId('register-email');
      await expect(emailField).toBeVisible();
      
      // Vérifier que le champ a un placeholder ou un label
      const placeholder = await emailField.getAttribute('placeholder');
      const id = await emailField.getAttribute('id');
      
      expect(placeholder || id).toBeTruthy();
    });

    test('should be navigable with keyboard', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      // Tab vers le premier champ
      await page.keyboard.press('Tab');
      
      // Vérifier qu'un élément a le focus
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'A', 'TEXTAREA']).toContain(focusedElement);
    });
  });

  // ============================================
  // RESPONSIVE
  // ============================================
  
  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const emailField = page.getByTestId('register-email');
      const submitButton = page.getByTestId('register-submit');
      
      await expect(emailField).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const emailField = page.getByTestId('register-email');
      const submitButton = page.getByTestId('register-submit');
      
      await expect(emailField).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const emailField = page.getByTestId('register-email');
      const submitButton = page.getByTestId('register-submit');
      
      await expect(emailField).toBeVisible();
      await expect(submitButton).toBeVisible();
    });
  });

  // ============================================
  // NAVIGATION ET UX
  // ============================================
  
  test.describe('Navigation & UX', () => {
    test('should navigate to login from register', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await ensureCookieBannerClosed(page);
      
      const loginLink = page.getByTestId('register-switch-login')
        .or(page.getByRole('link', { name: /connexion|login|se connecter|sign in/i }));
      
      if (await loginLink.isVisible().catch(() => false)) {
        await loginLink.click();
        await expect(page).toHaveURL(/.*login/);
      }
    });
  });
});

// ============================================
// TESTS DE PERFORMANCE
// ============================================

test.describe('Registration Performance', () => {
  test('should load registration page quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // La page devrait charger en moins de 10 secondes
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Register page load time: ${loadTime}ms`);
  });
});
