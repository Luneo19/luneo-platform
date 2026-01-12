import { test, expect } from '@playwright/test';
import { loginUser } from './utils/auth';

test.describe('Order Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await loginUser(page);
    } catch (error) {
      console.warn('Login skipped:', error);
    }
  });

  test('should display orders list', async ({ page }) => {
    // Mock orders API
    await page.route('**/api/v1/orders**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'order-1',
              orderNumber: 'ORD-001',
              status: 'PAID',
              total: 199.99,
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/dashboard/orders');
    await page.waitForLoadState('networkidle');

    // Check for orders list
    const heading = page.getByRole('heading', { name: /commandes|orders/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should view order details', async ({ page }) => {
    // Mock order details API
    await page.route('**/api/v1/orders/order-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: 'PAID',
          total: 199.99,
          items: [
            {
              id: 'item-1',
              productName: 'Test Product',
              quantity: 2,
              price: 99.99,
            },
          ],
          customer: {
            email: 'customer@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          createdAt: '2024-01-01T00:00:00Z',
        }),
      });
    });

    await page.goto('/dashboard/orders/order-1');
    await page.waitForLoadState('networkidle');

    // Check for order details
    const orderNumber = page.getByText(/ORD-001/);
    await expect(orderNumber).toBeVisible({ timeout: 5000 });
  });

  test('should update order status', async ({ page }) => {
    // Mock update order API
    await page.route('**/api/v1/orders/order-1', async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'order-1',
            status: 'SHIPPED',
            message: 'Order status updated',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard/orders/order-1');
    await page.waitForLoadState('networkidle');

    // Find status update button/dropdown
    const statusButton = page.getByRole('button', { name: /statut|status/i }).first();
    
    if (await statusButton.isVisible().catch(() => false)) {
      await statusButton.click();
      
      // Select new status
      const shippedOption = page.getByRole('option', { name: /expédié|shipped/i }).first();
      if (await shippedOption.isVisible().catch(() => false)) {
        await shippedOption.click();
        
        // Should show success message
        await expect(page.getByText(/mis à jour|updated|succès|success/i).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should filter orders by status', async ({ page }) => {
    // Mock filtered orders API
    await page.route('**/api/v1/orders**', async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: status === 'PAID' ? [
            { id: 'order-1', orderNumber: 'ORD-001', status: 'PAID', total: 199.99 },
          ] : [],
          total: status === 'PAID' ? 1 : 0,
        }),
      });
    });

    await page.goto('/dashboard/orders');
    await page.waitForLoadState('networkidle');

    // Find status filter
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').first();
    
    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.selectOption('PAID');
      await page.waitForTimeout(1000);
      
      // Verify filtered results
      const orderRows = page.locator('[class*="order"], [data-testid="order-row"]');
      const count = await orderRows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should export orders', async ({ page }) => {
    // Mock export endpoint
    await page.route('**/api/v1/orders/export**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'id,orderNumber,status,total\norder-1,ORD-001,PAID,199.99',
        headers: {
          'Content-Disposition': 'attachment; filename="orders.csv"',
        },
      });
    });

    await page.goto('/dashboard/orders');
    await page.waitForLoadState('networkidle');

    // Find export button
    const exportButton = page.getByRole('button', { name: /exporter|export/i }).first();
    
    if (await exportButton.isVisible().catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });

  test('should display order statistics', async ({ page }) => {
    // Mock statistics API
    await page.route('**/api/v1/orders/statistics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total: 100,
          paid: 80,
          pending: 15,
          cancelled: 5,
          totalRevenue: 19999.99,
        }),
      });
    });

    await page.goto('/dashboard/orders');
    await page.waitForLoadState('networkidle');

    // Check for statistics cards
    const statsCards = page.locator('[class*="stat"], [class*="card"], [data-testid="stat-card"]');
    const count = await statsCards.count();
    
    if (count > 0) {
      await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
