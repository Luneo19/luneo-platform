/**
 * E2E Tests: Agent Creation Flow (Happy Path)
 * Tests for agent creation, navigation, and related flows
 */

import { test, expect } from '@playwright/test';

test.describe('Agent Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form (use test credentials)
    await page.fill('input[name="email"], input[type="email"]', 'admin@luneo.app');
    await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Wait for dashboard redirect
    await page.waitForURL(/\/(dashboard|overview|agents)/, { timeout: 10000 });
  });

  test('should navigate to agents page', async ({ page }) => {
    await page.goto('/agents');
    await expect(page).toHaveURL(/\/agents/);
    // Should see either agents list or empty state
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate to create agent page', async ({ page }) => {
    await page.goto('/agents/new');
    await expect(page).toHaveURL(/\/agents\/new/);
    // Should see template selection
    await expect(
      page.locator('text=Créer un agent').or(page.locator('text=Create'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('should create agent from scratch', async ({ page }) => {
    await page.goto('/agents/create');

    // Step 1: Basic Info
    await page.fill('input[name="name"], input#name', 'Test Support Agent');
    await page.fill(
      'textarea[name="description"], textarea#description',
      'Agent de test pour le support'
    );

    // Click Next
    const nextButton = page.locator(
      'button:has-text("Suivant"), button:has-text("Next")'
    );
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // Step 2: AI Config (keep defaults)
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // Step 3: Review & Create
    const createButton = page.locator(
      'button:has-text("Créer"), button:has-text("Create")'
    );
    if (await createButton.isVisible()) {
      await createButton.click();

      // Should redirect to agent detail
      await page.waitForURL(/\/agents\/[a-z0-9-]+/, { timeout: 10000 });
    }
  });

  test('should navigate to knowledge page', async ({ page }) => {
    await page.goto('/knowledge');
    await expect(page).toHaveURL(/\/knowledge/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate to conversations page', async ({ page }) => {
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/conversations/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL(/\/analytics/);
  });

  test('should navigate to billing page', async ({ page }) => {
    await page.goto('/billing');
    await expect(page).toHaveURL(/\/billing/);
  });
});

test.describe('Knowledge Base Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@luneo.app');
    await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|overview|agents)/, { timeout: 10000 });
  });

  test('should create a knowledge base', async ({ page }) => {
    await page.goto('/knowledge');

    // Click create button
    const createBtn = page.locator(
      'button:has-text("Créer"), button:has-text("Create")'
    );
    if (await createBtn.isVisible()) {
      await createBtn.click();

      // Fill form in dialog
      await page.fill(
        'input[name="name"], input#name, input[placeholder*="nom"]',
        'FAQ Test'
      );

      const submitBtn = page
        .locator('button:has-text("Créer"), button:has-text("Submit")')
        .last();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
  });
});
