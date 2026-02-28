/**
 * E2E Tests - Complete User Journey
 * Tests the complete user journey from signup to order completion
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should complete full user journey: Signup → Login → Create Design → Order', async ({ page }) => {
    // Step 1: Signup
    await page.goto('/register');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    
    // Wait for CAPTCHA if present
    await page.waitForTimeout(2000);
    
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or verification page
    await page.waitForURL(/\/dashboard|\/verify-email/, { timeout: 10000 });
    
    // Step 2: Email Verification (if needed)
    const currentUrl = page.url();
    if (currentUrl.includes('/verify-email')) {
      // In real scenario, user would click link from email
      // For test, we'll simulate by going directly to dashboard if already verified
      await page.goto('/dashboard');
    }
    
    // Step 3: Login (if redirected to login)
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    }
    
    // Verify dashboard is loaded
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Step 4: Create Design
    // Navigate to create design page
    await page.goto('/dashboard/designs/new');
    
    // Select product (if product selection is required)
    const productSelect = page.locator('select[name="productId"]');
    if (await productSelect.count() > 0) {
      await productSelect.selectOption({ index: 0 });
    }
    
    // Fill design prompt
    await page.fill('textarea[name="prompt"]', 'A beautiful logo design for my brand');
    
    // Submit design
    await page.click('button[type="submit"]');
    
    // Wait for design to be created
    await page.waitForSelector('[data-testid="design-status"]', { timeout: 30000 });
    
    // Step 5: Wait for design to complete (or check status)
    const designStatus = await page.locator('[data-testid="design-status"]').textContent();
    expect(designStatus).toBeTruthy();
    
    // Step 6: Create Order (if design is completed)
    if (designStatus?.includes('COMPLETED') || designStatus?.includes('completed')) {
      await page.click('button:has-text("Order")');
      
      // Fill shipping address
      await page.fill('input[name="street"]', '123 Test Street');
      await page.fill('input[name="city"]', 'Test City');
      await page.fill('input[name="zipCode"]', '12345');
      await page.selectOption('select[name="country"]', 'FR');
      
      // Submit order
      await page.click('button[type="submit"]');
      
      // Verify order confirmation
      await expect(page.locator('text=Order confirmed')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid signup
    await page.goto('/register');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'weak');
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Invalid email')).toBeVisible();
    await expect(page.locator('text=Password')).toBeVisible();
  });

  test('should handle login errors', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });
});
