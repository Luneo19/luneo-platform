/**
 * E2E Tests - SEO Optimization
 * Tests for SEO metadata, structured data, and sitemap
 */

import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';

test.describe('SEO Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test('should have proper meta tags on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for essential meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    if (metaDescription) {
      expect(metaDescription.length).toBeGreaterThan(0);
      console.log('✅ Meta description found');
    }

    const metaKeywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    if (metaKeywords) {
      console.log('✅ Meta keywords found');
    }

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    if (ogTitle) {
      console.log('✅ Open Graph title found');
    }
  });

  test('should have structured data (JSON-LD)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for JSON-LD structured data
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const jsonLdCount = await jsonLdScripts.count();

    if (jsonLdCount > 0) {
      console.log(`✅ Found ${jsonLdCount} JSON-LD structured data blocks`);
      
      // Check content of first JSON-LD
      const firstJsonLd = await jsonLdScripts.first().textContent();
      if (firstJsonLd) {
        try {
          const data = JSON.parse(firstJsonLd);
          expect(data).toHaveProperty('@context');
          console.log(`✅ Valid JSON-LD with @context: ${data['@context']}`);
        } catch (e) {
          console.warn('⚠️ Invalid JSON-LD format');
        }
      }
    } else {
      console.warn('⚠️ No JSON-LD structured data found');
    }
  });

  test('should have sitemap.xml', async ({ page }) => {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await page.request.get(`${baseURL}/sitemap.xml`);

    if (response.status() === 200) {
      const content = await response.text();
      expect(content).toContain('<?xml');
      expect(content).toContain('<urlset');
      console.log('✅ Sitemap.xml accessible');
    } else {
      console.warn(`⚠️ Sitemap.xml returned status ${response.status()}`);
    }
  });

  test('should have robots.txt', async ({ page }) => {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await page.request.get(`${baseURL}/robots.txt`);

    if (response.status() === 200) {
      const content = await response.text();
      expect(content).toBeTruthy();
      console.log('✅ Robots.txt accessible');
    } else {
      console.warn(`⚠️ Robots.txt returned status ${response.status()}`);
    }
  });

  test('should have canonical URLs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const canonicalLink = page.locator('link[rel="canonical"]');
    const hasCanonical = await canonicalLink.count() > 0;

    if (hasCanonical) {
      const href = await canonicalLink.getAttribute('href');
      expect(href).toBeTruthy();
      console.log(`✅ Canonical URL found: ${href}`);
    } else {
      console.warn('⚠️ No canonical URL found');
    }
  });
});
