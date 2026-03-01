/**
 * Visual Regression Tests - Critical Pages
 * Screenshots of all critical pages for visual comparison
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Critical Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should match homepage screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic content
    await page.evaluate(() => {
      // Hide cookie banner if present
      const cookieBanner = document.querySelector('[data-testid="cookie-banner"]');
      if (cookieBanner) {
        (cookieBanner as HTMLElement).style.display = 'none';
      }
    });
    
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match login page screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match register page screenshot', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('register-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match dashboard screenshot', async ({ page }) => {
    // Login first
    await page.goto('/login');
    // Note: In real scenario, you'd use authenticated session
    // For now, we'll test the login page structure
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load or redirect
    await page.waitForTimeout(2000);
    
    // Only take screenshot if dashboard is accessible
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('should match pricing page screenshot', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('pricing-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match admin dashboard screenshot', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Wait for redirect or dashboard load
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('should match admin customers page screenshot', async ({ page }) => {
    await page.goto('/admin/customers');
    await page.waitForLoadState('networkidle');
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/customers');
    await expect(page).toHaveScreenshot('admin-customers.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('should match admin analytics page screenshot', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/analytics');
    await expect(page).toHaveScreenshot('admin-analytics.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});
