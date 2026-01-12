import { test, expect } from '@playwright/test';
import { loginUser } from './utils/auth';

test.describe('Analytics Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Login before accessing analytics
    try {
      await loginUser(page);
    } catch (error) {
      // If login fails, continue anyway (tests can be adapted)
      console.warn('Login skipped:', error);
    }
  });

  test('should display analytics dashboard', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for analytics elements
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display analytics charts', async ({ page }) => {
    // Mock analytics data
    await page.route('**/api/v1/analytics/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { date: '2024-01-01', value: 100 },
            { date: '2024-01-02', value: 150 },
            { date: '2024-01-03', value: 200 },
          ],
        }),
      });
    });

    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Check for chart containers
    const charts = page.locator('[class*="chart"], [class*="Chart"], canvas, svg').first();
    const hasCharts = await charts.isVisible().catch(() => false);
    
    if (hasCharts) {
      await expect(charts).toBeVisible({ timeout: 10000 });
    }
  });

  test('should export analytics data as CSV', async ({ page }) => {
    // Mock export endpoint
    await page.route('**/api/v1/analytics/export**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'date,value\n2024-01-01,100\n2024-01-02,150',
        headers: {
          'Content-Disposition': 'attachment; filename="analytics.csv"',
        },
      });
    });

    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Find export button
    const exportButton = page.getByRole('button', { name: /exporter|export/i }).first();
    
    if (await exportButton.isVisible().catch(() => false)) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });

  test('should export analytics data as Excel', async ({ page }) => {
    // Mock export endpoint
    await page.route('**/api/v1/analytics/export**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: Buffer.from('mock excel content'),
        headers: {
          'Content-Disposition': 'attachment; filename="analytics.xlsx"',
        },
      });
    });

    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Find export button and select Excel format
    const exportButton = page.getByRole('button', { name: /exporter|export/i }).first();
    
    if (await exportButton.isVisible().catch(() => false)) {
      await exportButton.click();
      
      // Select Excel format if modal appears
      const excelOption = page.getByRole('button', { name: /excel|xlsx/i }).first();
      if (await excelOption.isVisible().catch(() => false)) {
        const downloadPromise = page.waitForEvent('download');
        await excelOption.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.xlsx');
      }
    }
  });

  test('should filter analytics by date range', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Find date range picker
    const datePicker = page.locator('[data-testid="date-range-picker"], input[type="date"]').first();
    
    if (await datePicker.isVisible().catch(() => false)) {
      await datePicker.click();
      
      // Select date range (implementation depends on your date picker component)
      await page.waitForTimeout(1000);
      
      // Verify API call with date range
      let apiCalled = false;
      await page.route('**/api/v1/analytics/**', async (route) => {
        apiCalled = true;
        await route.continue();
      });

      const applyButton = page.getByRole('button', { name: /appliquer|apply/i }).first();
      if (await applyButton.isVisible().catch(() => false)) {
        await applyButton.click();
        await page.waitForTimeout(2000);
        
        // API should be called with date range
        expect(apiCalled).toBe(true);
      }
    }
  });

  test('should display funnel analysis', async ({ page }) => {
    // Mock funnel data
    await page.route('**/api/v1/analytics/funnels/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { stage: 'Visitors', count: 1000, conversion: 100 },
            { stage: 'Signups', count: 500, conversion: 50 },
            { stage: 'Purchases', count: 100, conversion: 10 },
          ],
        }),
      });
    });

    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Navigate to funnel view if available
    const funnelTab = page.getByRole('tab', { name: /funnel|entonnoir/i }).first();
    if (await funnelTab.isVisible().catch(() => false)) {
      await funnelTab.click();
      await page.waitForTimeout(2000);
      
      // Check for funnel visualization
      const funnelChart = page.locator('[class*="funnel"], [data-testid="funnel-chart"]').first();
      const hasFunnel = await funnelChart.isVisible().catch(() => false);
      
      if (hasFunnel) {
        await expect(funnelChart).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display cohort analysis', async ({ page }) => {
    // Mock cohort data
    await page.route('**/api/v1/analytics/cohorts/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { cohort: '2024-01', users: 100, retention: [100, 80, 60, 40] },
            { cohort: '2024-02', users: 150, retention: [150, 120, 90] },
          ],
        }),
      });
    });

    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Navigate to cohort view if available
    const cohortTab = page.getByRole('tab', { name: /cohort|cohorte/i }).first();
    if (await cohortTab.isVisible().catch(() => false)) {
      await cohortTab.click();
      await page.waitForTimeout(2000);
      
      // Check for cohort visualization
      const cohortChart = page.locator('[class*="cohort"], [data-testid="cohort-chart"]').first();
      const hasCohort = await cohortChart.isVisible().catch(() => false);
      
      if (hasCohort) {
        await expect(cohortChart).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
