import { test, expect } from '@playwright/test';

const publicPages = [
  '/', '/pricing', '/contact', '/about', '/blog', '/changelog',
  '/login', '/register', '/forgot-password',
  '/demo/customizer', '/demo/ar', '/demo/configurator',
  '/help-center', '/marketplace', '/gallery', '/templates',
  '/legal/cgv', '/legal/privacy', '/legal/cookies', '/legal/mentions',
  '/industries', '/solutions',
  '/integrations/shopify', '/integrations/woocommerce',
  '/virtual-try-on', '/testimonials', '/webinars',
  '/use-cases', '/use-cases/e-commerce', '/use-cases/print-on-demand',
  '/use-cases/branding', '/use-cases/marketing', '/use-cases/agency',
  '/use-cases/dropshipping',
  '/tarifs', '/support', '/team', '/whats-new', '/status',
];

test.describe('Pages publiques — chargement sans erreur', () => {
  test.setTimeout(30_000);
  for (const url of publicPages) {
    test(`PUBLIC ${url}`, async ({ page }) => {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      if (response) expect(response.status()).toBeLessThan(500);
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(10);
      expect(bodyText).not.toContain('Application error');
      expect(bodyText).not.toContain('Internal Server Error');
    });
  }
});

const dashboardPages = [
  '/dashboard', '/dashboard/products', '/dashboard/orders',
  '/dashboard/analytics', '/dashboard/billing', '/dashboard/billing/credits',
  '/dashboard/settings', '/dashboard/settings/security',
  '/dashboard/team', '/dashboard/ai-studio', '/dashboard/library',
  '/dashboard/collections', '/dashboard/favorites', '/dashboard/notifications',
  '/dashboard/integrations', '/dashboard/marketplace', '/dashboard/support',
  '/dashboard/webhooks', '/dashboard/monitoring', '/dashboard/channels',
  '/dashboard/production', '/dashboard/ar-studio', '/dashboard/configurator-3d',
  '/dashboard/customizer', '/dashboard/white-label', '/dashboard/editor',
];

test.describe('Pages dashboard — chargement avec auth', () => {
  test.setTimeout(30_000);
  for (const url of dashboardPages) {
    test(`DASHBOARD ${url}`, async ({ page }) => {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      if (response) expect(response.status()).toBeLessThan(500);
      await page.waitForTimeout(2000);
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Application error');
      expect(bodyText).not.toContain('Internal Server Error');
    });
  }
});

const superAdminPages = [
  '/super-admin', '/super-admin/customers', '/super-admin/brands',
  '/super-admin/billing', '/super-admin/analytics', '/super-admin/settings',
  '/super-admin/tickets', '/super-admin/designs', '/super-admin/events',
  '/super-admin/invoices', '/super-admin/audit-log', '/super-admin/webhooks',
];

test.describe('Pages super-admin — chargement', () => {
  test.setTimeout(30_000);
  for (const url of superAdminPages) {
    test(`ADMIN ${url}`, async ({ page }) => {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      if (response) expect(response.status()).toBeLessThan(500);
      await page.waitForTimeout(2000);
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Application error');
      expect(bodyText).not.toContain('Internal Server Error');
    });
  }
});
