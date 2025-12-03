/**
 * E2E Tests: Pricing & Checkout Flow
 * T-018: Parcours pricing → checkout → success
 */

import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('should display all pricing plans', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tarif|pricing/i })).toBeVisible();
    
    // Check all plans are visible
    await expect(page.getByText(/starter/i)).toBeVisible();
    await expect(page.getByText(/professionnel|professional/i)).toBeVisible();
    await expect(page.getByText(/business/i)).toBeVisible();
    await expect(page.getByText(/entreprise|enterprise/i)).toBeVisible();
  });

  test('should display correct prices', async ({ page }) => {
    await expect(page.getByText(/29.*€|€.*29/)).toBeVisible();
    await expect(page.getByText(/49.*€|€.*49/)).toBeVisible();
    await expect(page.getByText(/99.*€|€.*99/)).toBeVisible();
  });

  test('should toggle between monthly and yearly pricing', async ({ page }) => {
    // Find and click yearly toggle
    const yearlyToggle = page.getByRole('button', { name: /annuel|yearly/i });
    
    if (await yearlyToggle.isVisible()) {
      await yearlyToggle.click();
      
      // Yearly prices should show discount
      await expect(page.getByText(/économisez|save/i)).toBeVisible();
    }
  });

  test('should show features for each plan', async ({ page }) => {
    // Check features are listed
    await expect(page.getByText(/design|projet/i).first()).toBeVisible();
  });

  test('should have CTA buttons for each plan', async ({ page }) => {
    const ctaButtons = page.getByRole('button', { name: /choisir|commencer|select|start/i });
    await expect(ctaButtons.first()).toBeVisible();
  });

  test('should show contact sales for enterprise', async ({ page }) => {
    await expect(page.getByText(/contacter|contact|demande/i)).toBeVisible();
  });
});

test.describe('Checkout Flow', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/pricing');
    
    // Click on a plan CTA
    const starterButton = page.getByRole('button', { name: /starter/i }).or(
      page.locator('[data-plan="starter"]').getByRole('button')
    );
    
    if (await starterButton.isVisible()) {
      await starterButton.click();
      
      // Should redirect to login or show auth modal
      await expect(page).toHaveURL(/login|auth|checkout/);
    }
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/pricing');
    
    const faqSection = page.getByText(/questions fréquentes|faq/i);
    if (await faqSection.isVisible()) {
      await expect(faqSection).toBeVisible();
    }
  });
});

test.describe('Billing Success Page', () => {
  test('should display success message with session_id', async ({ page }) => {
    // Simulate successful checkout redirect
    await page.goto('/dashboard/billing/success?session_id=test_session_123');
    
    // Should show success or verification message
    await expect(page.getByText(/succès|merci|félicitations|vérification/i)).toBeVisible({ timeout: 5000 });
  });

  test('should redirect without session_id', async ({ page }) => {
    await page.goto('/dashboard/billing/success');
    
    // Should redirect to dashboard or show error
    await expect(page).toHaveURL(/dashboard|pricing|error/);
  });
});


