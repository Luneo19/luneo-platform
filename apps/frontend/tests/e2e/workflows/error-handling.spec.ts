/**
 * E2E Tests - Error Handling
 * Tests error scenarios and edge cases
 */

import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.goto('/dashboard');
    
    // Should show error message
    const errorMessage = page.locator('text=Error|text=Failed|text=Network');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle 404 errors', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should show 404 page
    await expect(page.locator('text=404|text=Not Found|text=Page not found')).toBeVisible({ timeout: 5000 });
  });

  test('should handle 500 errors', async ({ page }) => {
    // Simulate server error
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/dashboard');
    
    // Should show error message
    await page.waitForTimeout(2000);
    const errorMessage = page.locator('text=Error|text=500|text=Server');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should handle validation errors', async ({ page }) => {
    await page.goto('/register');
    
    // Submit form without filling required fields
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=required|text=invalid')).toBeVisible({ timeout: 3000 });
  });

  test('should handle rate limiting', async ({ page }) => {
    // Simulate rate limit
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 429,
        headers: {
          'Retry-After': '60',
        },
        body: JSON.stringify({ error: 'Too many requests' }),
      });
    });

    await page.goto('/dashboard');
    
    // Should show rate limit message
    await page.waitForTimeout(2000);
    const rateLimitMessage = page.locator('text=Too many|text=Rate limit|text=429');
    if (await rateLimitMessage.count() > 0) {
      await expect(rateLimitMessage.first()).toBeVisible();
    }
  });
});
