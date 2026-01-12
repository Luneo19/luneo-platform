/**
 * E2E Tests - Admin Dashboard Flow
 * Tests admin workflows: Login → View Customers → Analytics → Export
 */

import { test, expect } from '@playwright/test';
import { createTestUser, TEST_USER } from '../utils/auth';

test.describe('Admin Dashboard Flow', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    // Create admin user and get token
    // In real scenario, this would be done via API or test database
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@luneo.app',
        password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
      },
    });

    if (response.ok()) {
      const data = await response.json();
      adminToken = data.accessToken;
    }
  });

  test('should access admin dashboard', async ({ page, context }) => {
    // Set auth token in cookies or localStorage
    await context.addCookies([
      {
        name: 'accessToken',
        value: adminToken,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin');
    
    // Verify admin dashboard is loaded
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should view customers list', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: adminToken,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin/customers');
    
    // Verify customers table is loaded
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
  });

  test('should filter customers', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: adminToken,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin/customers');
    
    // Search for customer
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test@example.com');
      await page.waitForTimeout(1000);
      
      // Verify results are filtered
      const tableRows = page.locator('tbody tr');
      const count = await tableRows.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should view analytics', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: adminToken,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin/analytics');
    
    // Verify analytics charts are loaded
    await expect(page.locator('[data-testid="mrr-card"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="customers-card"]')).toBeVisible();
  });

  test('should export analytics', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: adminToken,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin/analytics');
    
    // Click export button
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click(),
      ]);
      
      // Verify download started
      expect(download.suggestedFilename()).toMatch(/\.(csv|pdf|xlsx)$/);
    }
  });
});
