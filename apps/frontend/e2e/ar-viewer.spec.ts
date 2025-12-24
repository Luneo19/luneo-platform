import { test, expect } from '@playwright/test';

test.describe('AR Viewer', () => {
  test('should load AR viewer page', async ({ page }) => {
    await page.goto('/ar/viewer');
    
    // Wait for AR viewer to load
    await page.waitForSelector('canvas, [data-testid*="ar"]', { timeout: 10000 });
    
    // Verify AR viewer is visible
    const arViewer = page.locator('canvas, [data-testid*="ar"]').first();
    await expect(arViewer).toBeVisible();
  });

  test('should detect WebXR support', async ({ page }) => {
    await page.goto('/ar/viewer');
    
    // Check for WebXR support message
    const supportMessage = page.locator('text=AR, text=WebXR, text=support');
    await expect(supportMessage.first()).toBeVisible({ timeout: 5000 });
  });
});

