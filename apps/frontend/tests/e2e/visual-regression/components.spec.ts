/**
 * Visual Regression Tests - Components
 * Screenshots of critical components for visual comparison
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should match button components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find buttons and take screenshots
    const buttons = await page.locator('button').all();
    
    if (buttons.length > 0) {
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const button = buttons[i];
        await expect(button).toHaveScreenshot(`button-${i}.png`, {
          maxDiffPixels: 50,
        });
      }
    }
  });

  test('should match form inputs', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    const inputs = await page.locator('input').all();
    
    if (inputs.length > 0) {
      for (let i = 0; i < Math.min(inputs.length, 5); i++) {
        const input = inputs[i];
        await expect(input).toHaveScreenshot(`input-${i}.png`, {
          maxDiffPixels: 50,
        });
      }
    }
  });

  test('should match card components', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    const cards = await page.locator('[data-testid="pricing-card"], .card, [class*="card"]').all();
    
    if (cards.length > 0) {
      for (let i = 0; i < Math.min(cards.length, 3); i++) {
        const card = cards[i];
        await expect(card).toHaveScreenshot(`card-${i}.png`, {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('should match navigation components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const nav = page.locator('nav, header, [role="navigation"]').first();
    
    if (await nav.count() > 0) {
      await expect(nav).toHaveScreenshot('navigation.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('should match modal components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to trigger a modal (if available)
    const modalTrigger = page.locator('button:has-text("Sign up"), button:has-text("Get started")').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(500);
      
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
      
      if (await modal.count() > 0) {
        await expect(modal).toHaveScreenshot('modal.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });
});
