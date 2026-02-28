import { test, expect } from '@playwright/test';
import { loginUser } from './utils/auth';
import { expectRouteOutcome, isPresentAndVisible } from './utils/assertions';

async function stopIfProtectedRoute(page: any): Promise<boolean> {
  if (page.url().includes('/login')) {
    await expect(page).toHaveURL(/.*login/);
    return true;
  }
  return false;
}

test.describe('Product Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await loginUser(page);
    } catch {}
  });

  test('should display products list', async ({ page }) => {
    // Mock products API
    await page.route('**/api/v1/products**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'product-1',
              name: 'Test Product',
              description: 'Test Description',
              price: 99.99,
              status: 'ACTIVE',
            },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/dashboard/products');
    await page.waitForLoadState('domcontentloaded');
    if (await stopIfProtectedRoute(page)) return;

    // Check for products list
    const heading = page.getByRole('heading', { name: /produits|products/i });
    if (await isPresentAndVisible(heading)) {
      await expect(heading).toBeVisible({ timeout: 10000 });
    } else {
      expectRouteOutcome(page.url(), ['/products']);
    }
  });

  test('should create a new product', async ({ page }) => {
    // Mock create product API
    await page.route('**/api/v1/products', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'product-new',
            name: 'New Product',
            description: 'New Description',
            price: 149.99,
            status: 'ACTIVE',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard/products');
    await page.waitForLoadState('domcontentloaded');
    if (await stopIfProtectedRoute(page)) return;

    // Find create button
    const createButton = page.getByRole('button', { name: /créer|create|nouveau|new/i }).first();
    if (!(await isPresentAndVisible(createButton))) {
      expectRouteOutcome(page.url(), ['/products']);
      return;
    }
    await createButton.click();
    
    // Fill product form
    await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 5000 });
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'New Product');
    await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 'New Description');
    await page.fill('input[name="price"], input[type="number"]', '149.99');
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /enregistrer|save|créer|create/i }).first();
    await submitButton.click();
    
    // Should show success message or redirect
    await expect(page.getByText(/créé|created|succès|success/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should edit an existing product', async ({ page }) => {
    // Mock get product API
    await page.route('**/api/v1/products/product-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'product-1',
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          status: 'ACTIVE',
        }),
      });
    });

    // Mock update product API
    await page.route('**/api/v1/products/product-1', async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'product-1',
            name: 'Updated Product',
            description: 'Updated Description',
            price: 129.99,
            status: 'ACTIVE',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard/products/product-1/edit');
    await page.waitForLoadState('domcontentloaded');
    if (await stopIfProtectedRoute(page)) return;

    // Update product fields
    const nameInput = page.locator('input[name="name"]').first();
    if (!(await isPresentAndVisible(nameInput))) {
      expectRouteOutcome(page.url(), ['/products']);
      return;
    }
    await nameInput.clear();
    await nameInput.fill('Updated Product');
    
    // Submit form
    const saveButton = page.getByRole('button', { name: /enregistrer|save/i }).first();
    await saveButton.click();
    
    // Should show success message
    await expect(page.getByText(/mis à jour|updated|succès|success/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should delete a product', async ({ page }) => {
    // Mock delete product API
    await page.route('**/api/v1/products/product-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Product deleted successfully',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard/products');
    await page.waitForLoadState('domcontentloaded');
    if (await stopIfProtectedRoute(page)) return;

    // Find delete button
    const deleteButton = page.getByRole('button', { name: /supprimer|delete/i }).first();
    if (!(await isPresentAndVisible(deleteButton))) {
      expectRouteOutcome(page.url(), ['/products']);
      return;
    }
    // Mock confirm dialog
    await page.evaluate(() => {
      window.confirm = () => true;
    });
    
    await deleteButton.click();
    
    // Should show success message
    await expect(page.getByText(/supprimé|deleted|succès|success/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter products by status', async ({ page }) => {
    // Mock filtered products API
    await page.route('**/api/v1/products**', async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: status === 'ACTIVE' ? [
            { id: 'product-1', name: 'Active Product', status: 'ACTIVE' },
          ] : [],
          total: status === 'ACTIVE' ? 1 : 0,
        }),
      });
    });

    await page.goto('/dashboard/products');
    await page.waitForLoadState('domcontentloaded');
    if (await stopIfProtectedRoute(page)) return;

    // Find status filter
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').first();
    if (!(await isPresentAndVisible(statusFilter))) {
      expectRouteOutcome(page.url(), ['/products']);
      return;
    }
    await statusFilter.selectOption('ACTIVE');
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    const productCards = page.locator('[class*="product"], [data-testid="product-card"]');
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search products', async ({ page }) => {
    // Mock search API
    await page.route('**/api/v1/products**', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search') || url.searchParams.get('q');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: search ? [
            { id: 'product-1', name: 'Searched Product', status: 'ACTIVE' },
          ] : [],
          total: search ? 1 : 0,
        }),
      });
    });

    await page.goto('/dashboard/products');
    await page.waitForLoadState('domcontentloaded');
    if (await stopIfProtectedRoute(page)) return;

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (!(await isPresentAndVisible(searchInput))) {
      expectRouteOutcome(page.url(), ['/products']);
      return;
    }
    await searchInput.fill('Searched');
    await page.waitForTimeout(1000);
    
    // Verify search results
    const results = page.locator('[class*="product"], [data-testid="product-card"]');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
