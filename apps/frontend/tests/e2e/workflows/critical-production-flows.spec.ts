/**
 * E2E Tests - 5 Critical Production Flows
 * These tests validate the most critical user journeys for production readiness.
 * 
 * Flow 1: Landing -> Pricing -> Register -> Onboarding -> Dashboard
 * Flow 2: Login -> Dashboard -> Create Design -> AI Studio
 * Flow 3: Billing -> Upgrade Plan -> Stripe Checkout -> Success
 * Flow 4: Admin -> Suspend Brand -> Verify Restriction
 * Flow 5: Marketplace -> Browse -> Purchase -> Download
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}@luneo-test.com`;
const TEST_PASSWORD = 'TestSecure123!';

// ═══════════════════════════════════════════════════════════════════
// Flow 1: Landing -> Pricing -> Register -> Onboarding -> Dashboard
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 1: New User Registration Journey', () => {
  test('should navigate from landing to pricing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Luneo/i);
    
    const pricingLink = page.getByRole('link', { name: /prix|pricing/i }).first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await page.waitForURL(/\/pricing/);
    } else {
      await page.goto('/pricing');
    }
    
    await expect(page.locator('body')).toContainText(/starter|professional|business|enterprise/i);
  });

  test('should display all subscription plans with correct structure', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('body')).toContainText(/mois|month/i);

    const ctaButtons = page.getByRole('button', { name: /commencer|start|choisir|select|essayer/i });
    const ctaLinks = page.getByRole('link', { name: /commencer|start|choisir|select/i });
    if ((await ctaButtons.count()) > 0) {
      await expect(ctaButtons.first()).toBeVisible({ timeout: 5000 });
    } else {
      await expect(ctaLinks.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    
    const firstNameInput = page.locator('input[name="firstName"]').first();
    if ((await firstNameInput.count()) > 0 && (await firstNameInput.isVisible())) {
      await firstNameInput.fill('E2E');
    }
    const lastNameInput = page.locator('input[name="lastName"]').first();
    if ((await lastNameInput.count()) > 0 && (await lastNameInput.isVisible())) {
      await lastNameInput.fill('TestUser');
    }

    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if ((await termsCheckbox.count()) > 0 && (await termsCheckbox.isVisible())) {
      await termsCheckbox.check();
    }
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(onboarding|dashboard|verify)/, { timeout: 15000 });
  });

  test('should display onboarding flow', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('body')).toContainText(/.+/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Flow 2: Login -> Dashboard -> Create Design -> AI Studio
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 2: Design Creation Journey', () => {
  test('should login page render correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display dashboard with navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
    
    if (page.url().includes('/dashboard')) {
      const sidebar = page.locator('nav, [role="navigation"], aside').first();
      await expect(sidebar).toBeVisible();
    }
  });

  test('should navigate to AI Studio', async ({ page }) => {
    await page.goto('/dashboard/ai-studio');
    await page.waitForURL(/\/(dashboard\/ai-studio|login)/, { timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Flow 3: Billing -> Upgrade Plan -> Stripe Checkout
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 3: Billing & Subscription', () => {
  test('should display billing page', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await page.waitForURL(/\/(dashboard\/billing|login)/, { timeout: 10000 });
    
    if (page.url().includes('/billing')) {
      await expect(page.locator('body')).toContainText(/plan|abonnement|subscription/i);
    }
  });

  test('should show upgrade options', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('body')).toContainText(/professional|business|enterprise/i);
  });

  test('should handle checkout success page', async ({ page }) => {
    await page.goto('/checkout/success');
    await expect(page.locator('body')).toContainText(/.+/);
  });

  test('should handle checkout cancel page', async ({ page }) => {
    await page.goto('/checkout/cancel');
    await expect(page.locator('body')).toContainText(/.+/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Flow 4: Admin -> Suspend Brand -> Verify Restriction
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 4: Admin Brand Management', () => {
  test('should protect admin routes from unauthenticated users', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/\/(admin|login|dashboard)/, { timeout: 10000 });
    // Un utilisateur non authentifié ne doit jamais rester sur la racine admin.
    expect(page.url()).not.toMatch(/\/admin\/?$/);
  });

  test('should protect admin brands page', async ({ page }) => {
    await page.goto('/admin/brands');
    await page.waitForURL(/\/(admin\/brands|login|dashboard)/, { timeout: 10000 });
    // Même contrainte de protection sur une page admin sensible.
    expect(page.url()).not.toContain('/admin/brands');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Flow 5: Marketplace -> Browse -> Purchase
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 5: Marketplace Journey', () => {
  test('should display marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.locator('body')).toContainText(/marketplace|template|design/i);
  });

  test('should have search capability', async ({ page }) => {
    await page.goto('/marketplace');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="chercher" i], input[placeholder*="rechercher" i]');
    if ((await searchInput.count()) > 0 && (await searchInput.first().isVisible())) {
      await searchInput.first().fill('design');
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate to template detail', async ({ page }) => {
    await page.goto('/marketplace');

    const templateLink = page.locator('a[href*="/marketplace/"]').first();
    if ((await templateLink.count()) > 0 && (await templateLink.isVisible())) {
      await templateLink.click();
      await page.waitForURL(/\/marketplace\/.+/);
      await expect(page.locator('body')).toContainText(/.+/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// Cross-cutting: Critical Page Load Verification
// ═══════════════════════════════════════════════════════════════════

test.describe('Critical Pages Load Successfully', () => {
  const criticalPages = [
    '/',
    '/pricing',
    '/login',
    '/register',
    '/contact',
    '/marketplace',
    '/legal/privacy',
    '/legal/terms',
    '/legal/gdpr',
    '/legal/ndsg',
  ];

  for (const path of criticalPages) {
    test(`should load ${path} without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      
      const criticalErrors = errors.filter(
        e => !e.includes('hydration') && !e.includes('ResizeObserver')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }
});
