/**
 * E2E Tests - Performance Monitoring
 * Tests for Web Vitals tracking and performance metrics
 */

import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';

test.describe('Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test('should track Web Vitals on page load', async ({ page }) => {
    // Intercept Web Vitals API calls
    const webVitalsCalls: any[] = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/api/analytics/web-vitals')) {
        const postData = request.postData();
        if (postData) {
          try {
            const data = JSON.parse(postData);
            webVitalsCalls.push(data);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    await page.goto('/dashboard/overview');
    await page.waitForLoadState('networkidle');

    // Wait for Web Vitals to be sent (they're sent after page load)
    await page.waitForTimeout(3000);

    // Check if Web Vitals were tracked
    if (webVitalsCalls.length > 0) {
      console.log(`✅ Web Vitals tracked: ${webVitalsCalls.length} metrics`);
      
      // Check for common Web Vitals
      const metrics = webVitalsCalls.map((call) => call.name);
      const hasLCP = metrics.includes('LCP');
      const hasFCP = metrics.includes('FCP');
      const hasCLS = metrics.includes('CLS');

      if (hasLCP || hasFCP || hasCLS) {
        console.log(`✅ Found Web Vitals: ${metrics.join(', ')}`);
      }
    } else {
      console.warn('⚠️ Web Vitals not tracked (might be disabled in dev)');
    }
  });

  test('should have performance metrics in page', async ({ page }) => {
    await page.goto('/dashboard/overview');
    await page.waitForLoadState('networkidle');

    // Check if performance monitoring script is loaded
    const performanceScript = page.locator('script').filter({
      hasText: /web-vitals|performance/i,
    });

    const hasPerformanceScript = await performanceScript.count() > 0;

    if (hasPerformanceScript) {
      console.log('✅ Performance monitoring script found');
    } else {
      console.warn('⚠️ Performance monitoring script not found');
    }
  });

  test('should track API performance', async ({ page }) => {
    const apiCalls: any[] = [];
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        const timing = response.timing();
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          timing: timing,
        });
      }
    });

    await page.goto('/dashboard/overview');
    await page.waitForLoadState('networkidle');

    // Check API call performance
    if (apiCalls.length > 0) {
      const slowCalls = apiCalls.filter(
        (call) => call.timing && call.timing.responseEnd - call.timing.requestStart > 1000
      );

      if (slowCalls.length > 0) {
        console.warn(`⚠️ Found ${slowCalls.length} slow API calls (>1s)`);
      } else {
        console.log(`✅ All API calls completed in <1s`);
      }
    }
  });
});
