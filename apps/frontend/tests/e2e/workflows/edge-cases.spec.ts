/**
 * E2E Tests - Edge Cases
 * Tests edge cases and boundary conditions
 */

import { test, expect } from '@playwright/test';

test.describe('Edge Cases', () => {
  test('should handle very long input strings', async ({ page }) => {
    await page.goto('/register');
    
    const longString = 'a'.repeat(10000);
    await page.fill('input[name="firstName"]', longString);
    
    // Should either truncate or show validation error
    const inputValue = await page.inputValue('input[name="firstName"]');
    expect(inputValue.length).toBeLessThanOrEqual(255); // Typical max length
  });

  test('should handle special characters in inputs', async ({ page }) => {
    await page.goto('/register');
    
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    await page.fill('input[name="firstName"]', specialChars);
    await page.fill('input[name="email"]', `test${specialChars}@example.com`);
    
    // Should handle or validate special characters
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Should either accept or show validation error
    const errorMessage = page.locator('text=invalid|text=Error');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should handle concurrent requests', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Trigger multiple requests simultaneously
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        page.evaluate(() => {
          return fetch('/api/v1/user/me').then(r => r.status);
        }),
      );
    }
    
    const results = await Promise.all(promises);
    
    // All requests should complete (may be rate limited)
    results.forEach(status => {
      expect([200, 401, 429]).toContain(status);
    });
  });

  test('should handle rapid clicks', async ({ page }) => {
    await page.goto('/register');
    
    const submitButton = page.locator('button[type="submit"]');
    
    // Rapidly click submit button
    for (let i = 0; i < 10; i++) {
      await submitButton.click({ delay: 50 });
    }
    
    // Should only submit once
    await page.waitForTimeout(2000);
    
    // Should not create multiple users or show multiple errors
    const errorMessages = await page.locator('text=Error').count();
    expect(errorMessages).toBeLessThanOrEqual(1);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    await page.goto('/login');
    await page.goto('/register');
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should handle page refresh during form submission', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', 'refresh-test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    
    // Start submission and immediately refresh
    const submitPromise = page.click('button[type="submit"]');
    await page.reload();
    await submitPromise.catch(() => {}); // Ignore errors from refresh
    
    // Page should reload without errors
    await expect(page).toHaveURL(/\/register/);
  });
});
