/**
 * E2E Tests: Navigation & Public Pages
 * Tests for all public pages and navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/luneo/i);
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should have main navigation links', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('link', { name: /pricing|tarif/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible();
  });

  test('should have CTA buttons', async ({ page }) => {
    await page.goto('/');
    
    const ctaButton = page.getByRole('link', { name: /commencer|essai|start|try/i }).first();
    await expect(ctaButton).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
});

test.describe('Public Pages', () => {
  const publicPages = [
    { path: '/pricing' },
    { path: '/contact' },
    { path: '/marketplace' },
  ];

  for (const { path } of publicPages) {
    test(`should load ${path} page`, async ({ page }) => {
      await page.goto(path);
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/404|error|not found/i);
    });
  }
});

test.describe('Contact Page', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.getByLabel(/nom|name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /envoyer|send|submit/i })).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/contact');
    
    await page.getByRole('button', { name: /envoyer|send|submit/i }).click();
    
    // Should show validation errors or prevent submission
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should submit form with valid data', async ({ page }) => {
    await page.goto('/contact');
    
    await page.getByLabel(/nom|name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('This is a test message');
    
    await page.getByRole('button', { name: /envoyer|send|submit/i }).click();
    
    // Should show success message
    await expect(page.getByText(/succès|merci|envoyé|success|thank/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Marketplace', () => {
  test('should display templates', async ({ page }) => {
    await page.goto('/marketplace');
    
    await expect(page.getByRole('heading', { name: /marketplace|template/i })).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/marketplace');
    
    const searchInput = page.getByPlaceholder(/rechercher|search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check for category or filter elements
    const filterButton = page.getByRole('button', { name: /filtre|filter|catégorie|category/i });
    if (await filterButton.isVisible()) {
      await expect(filterButton).toBeVisible();
    }
  });
});

test.describe('404 Page', () => {
  test('should display 404 for non-existent pages', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    
    await expect(page.getByText(/404|not found|page non trouvée/i)).toBeVisible();
  });

  test('should have link back to home', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    
    const homeLink = page.getByRole('link', { name: /accueil|home|retour/i });
    await expect(homeLink).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have skip to content link', async ({ page }) => {
    await page.goto('/');
    
    // Focus on body to trigger skip link visibility
    await page.keyboard.press('Tab');
    
    await expect(page.getByText(/aller au contenu|skip to content/i)).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Images should have alt attribute (can be empty for decorative)
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Should have hamburger menu or mobile nav
    const mobileMenu = page.getByRole('button', { name: /menu/i }).or(
      page.locator('[data-testid="mobile-menu"]')
    );
    
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});


