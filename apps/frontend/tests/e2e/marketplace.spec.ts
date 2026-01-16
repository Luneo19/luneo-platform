/**
 * @fileoverview Tests E2E Playwright pour le Marketplace
 * @module Marketplace.e2e.spec
 *
 * Conforme au plan PHASE 9 - Tests & CI/CD
 */

import { test, expect } from '@playwright/test';

test.describe('Marketplace - Creator Profile', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-creator@example.com');
    await page.fill('input[name="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create creator profile', async ({ page }) => {
    await page.goto('/marketplace/creator/setup');

    // Remplir le formulaire de profil
    await page.fill('input[name="username"]', 'testcreator');
    await page.fill('input[name="displayName"]', 'Test Creator');
    await page.fill('textarea[name="bio"]', 'I am a creative designer');

    // Soumettre
    await page.click('button[type="submit"]');

    // Vérifier la redirection vers le profil
    await expect(page).toHaveURL(/\/marketplace\/creator\/testcreator/);
    await expect(page.locator('h1')).toContainText('Test Creator');
  });

  test('should display creator profile page', async ({ page }) => {
    await page.goto('/marketplace/creator/testcreator');

    // Vérifier les éléments du profil
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="creator-bio"]')).toBeVisible();
    await expect(page.locator('[data-testid="creator-stats"]')).toBeVisible();
  });
});

test.describe('Marketplace - Templates', () => {
  test('should browse marketplace templates', async ({ page }) => {
    await page.goto('/marketplace/templates');

    // Vérifier que la liste de templates est visible
    await expect(page.locator('[data-testid="template-list"]')).toBeVisible();

    // Vérifier les filtres
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
  });

  test('should view template details', async ({ page }) => {
    await page.goto('/marketplace/templates/test-template');

    // Vérifier les détails du template
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-price"]')).toBeVisible();
  });

  test('should like a template', async ({ page }) => {
    await page.goto('/marketplace/templates/test-template');

    // Cliquer sur le bouton like
    const likeButton = page.locator('[data-testid="like-button"]');
    await likeButton.click();

    // Vérifier que le like est enregistré
    await expect(likeButton).toHaveAttribute('data-liked', 'true');
  });
});

test.describe('Marketplace - Purchase Flow', () => {
  test('should purchase a paid template', async ({ page }) => {
    await page.goto('/marketplace/templates/paid-template');

    // Cliquer sur "Purchase"
    await page.click('[data-testid="purchase-button"]');

    // Vérifier la redirection vers le checkout
    await expect(page).toHaveURL(/\/checkout/);

    // Remplir les informations de paiement (Stripe test)
    // ... (simplifié pour l'exemple)

    // Vérifier la confirmation
    await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible();
  });
});
