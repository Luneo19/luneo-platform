import { test, expect } from '@playwright/test';
import { createHmac } from 'crypto';

const mockSummaryResponse = {
  plan: {
    id: 'starter',
    name: 'Starter',
    headline: 'Pack découverte pour les studios en phase de test',
    basePriceCents: 2900,
    quotas: [
      {
        metric: 'ai_generations',
        label: 'Générations IA',
        description: 'Prompts générés via le studio',
        limit: 50,
        period: 'month',
        overage: 'charge',
        overageRate: 75,
        unit: 'generation',
        notificationThresholds: [75, 90],
      },
      {
        metric: 'renders_2d',
        label: 'Rendus 2D',
        description: 'Exports haute définition',
        limit: 120,
        period: 'month',
        overage: 'charge',
        overageRate: 25,
        unit: 'render',
        notificationThresholds: [70, 90],
      },
      {
        metric: 'team_members',
        label: 'Membres d’équipe',
        description: 'Collaborateurs actifs',
        limit: 3,
        period: 'month',
        overage: 'block',
        unit: 'seat',
        notificationThresholds: [80, 95],
      },
    ],
    features: [
      { id: 'support', label: 'Support standard', enabled: true },
      { id: 'api', label: 'Accès API', enabled: true },
    ],
  },
  summary: {
    brandId: 'brand_dashboard',
    period: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      status: 'active',
    },
    metrics: [
      {
        type: 'ai_generations',
        current: 46,
        limit: 50,
        percentage: 92,
        overage: 0,
      },
      {
        type: 'renders_2d',
        current: 95,
        limit: 120,
        percentage: 79,
        overage: 0,
      },
      {
        type: 'team_members',
        current: 3,
        limit: 3,
        percentage: 100,
        overage: 0,
      },
    ],
    estimatedCost: {
      base: 2900,
      usage: 0,
      overage: 1125,
      total: 4025,
    },
    alerts: [
      {
        severity: 'critical',
        message: 'Générations IA usage is at 92% of your plan limit.',
        metric: 'ai_generations',
        threshold: 90,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        severity: 'warning',
        message: 'Rendus 2D usage is at 79% of your plan limit.',
        metric: 'renders_2d',
        threshold: 75,
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
    ],
  },
};

const mockTopupHistory = [
  {
    id: 'topup_1',
    brandId: 'brand_dashboard',
    metric: 'ai_generations',
    units: 25,
    unitPriceCents: 75,
    totalPriceCents: 1875,
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'topup_2',
    brandId: 'brand_dashboard',
    metric: 'renders_2d',
    units: 40,
    unitPriceCents: 25,
    totalPriceCents: 1000,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SHARE_SECRET = process.env.QUOTA_SHARE_SECRET ?? 'luneo-share-secret';

function buildShareToken(payload: any): string {
  const encoded = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 60 * 60 * 1000,
    }),
  ).toString('base64url');
  const signature = createHmac('sha256', SHARE_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

test.describe('Usage quota overview dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/usage-billing/summary', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(mockSummaryResponse),
        headers: { 'content-type': 'application/json' },
      });
    });
    await page.route('**/usage-billing/topups/history', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(mockTopupHistory),
        headers: { 'content-type': 'application/json' },
      });
    });
    await page.route('**/usage-billing/topups/simulate', async (route) => {
      const payload = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          brandId: mockSummaryResponse.summary.brandId,
          metric: payload.metric,
          unit: 'unit',
          baseLimit: 50,
          bonusUnits: 0,
          effectiveLimit: 50,
          simulatedLimit: 50 + payload.units,
          current: 46,
          currentPercentage: 92,
          simulatedPercentage: (46 / (50 + payload.units)) * 100,
          originalDaysToLimit: 1,
          simulatedDaysToLimit: 5,
          regainedDays: 4,
          estimatedCostCents: 75 * payload.units,
          overagePolicy: 'charge',
        }),
        headers: { 'content-type': 'application/json' },
      });
    });
  });

  test('renders plan snapshot, alerts timeline and upgrade CTA', async ({ page }) => {
    await page.goto('/analytics');

    await expect(page.getByRole('heading', { name: 'Usage & quotas' })).toBeVisible();
    await expect(page.getByText('Plan actuel')).toBeVisible();
    await expect(page.getByText('Générations IA')).toBeVisible();

    const alertTimeline = page.getByText('Générations IA usage is at 92% of your plan limit.');
    await expect(alertTimeline).toBeVisible();

    await expect(page.getByText('Plan recommandé')).toBeVisible();
    await expect(page.getByRole('link', { name: /Comparer les plans/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Parler à un expert/ })).toBeVisible();
  });

  test('displays projections and pressure cards based on usage', async ({ page }) => {
    await page.goto('/analytics');

    await expect(page.getByText('Pression maximale')).toBeVisible();
    const projectionCard = page.getByText('Sous tension').first();
    await expect(projectionCard).toBeVisible();

    const aiQuotaCard = page.getByText('Générations IA').first();
    await expect(aiQuotaCard).toBeVisible();
    await expect(aiQuotaCard.locator('..').locator('text=92% utilisé')).toBeVisible();
  });

  test('allows copying share link page and renders the public snapshot', async ({ page }) => {
    const sharePayload = {
      brandId: 'brand_dashboard',
      plan: 'Starter',
      overage: 1125,
      recommendation: 'Professional',
      pressure: { metric: 'Générations IA', percentage: 92 },
      timestamp: new Date().toISOString(),
    };
    const token = encodeURIComponent(buildShareToken(sharePayload));
    await page.goto(`/share/quota/${token}`);

    await expect(page.getByText('Snapshot partagé')).toBeVisible();
    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Générations IA')).toBeVisible();
    await expect(page.getByRole('link', { name: /Ouvrir le dashboard complet/ })).toBeVisible();
  });

  test('can simulate a top-up and trigger checkout', async ({ page, context }) => {
    await page.route('**/usage-billing/topups/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ checkoutUrl: 'https://stripe.test/session' }),
        headers: { 'content-type': 'application/json' },
      });
    });

    await page.route('https://stripe.test/session', async (route) => {
      await route.fulfill({
        status: 200,
        body: '<html><body>Stripe Mock</body></html>',
        headers: { 'content-type': 'text/html' },
      });
    });

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      (async () => {
        await page.goto('/analytics');
        await page.getByLabel('Métrique à renforcer').click();
        await page.getByRole('option', { name: 'Générations IA' }).click();
        await page.getByLabel('Crédits supplémentaires').locator('input[type="number"]').fill('10');
        await page.getByRole('button', { name: 'Acheter ce top-up' }).click();
      })(),
    ]);

    await popup.waitForLoadState('load');
    expect(popup.url()).toContain('https://stripe.test/session');
  });
});


