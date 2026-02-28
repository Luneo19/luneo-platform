import * as crypto from 'crypto';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import Stripe from 'stripe';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StripeService } from '@/modules/billing/stripe.service';
import { StripeClientService } from '@/modules/billing/services/stripe-client.service';
import { UsageMeteringService } from '@/modules/usage-billing/usage-metering.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import {
  closeIntegrationTestApp,
  createIntegrationTestModule,
} from '@/common/test/test-app.module';

function signStripePayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

describeIntegration('Stripe Webhook Signed + Reconciliation Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let stripeService: StripeService;
  let usageMeteringService: UsageMeteringService;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock_secret_for_testing';
  const stripe = new Stripe('sk_test_mock_key_for_testing', { apiVersion: '2023-10-16' });

  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

    const moduleBuilder = await createIntegrationTestModule();
    moduleBuilder.overrideProvider(StripeClientService).useValue({
      getStripe: jest.fn().mockResolvedValue(stripe),
      executeWithResilience: jest.fn(),
      stripeConfigValid: true,
      validatedPriceIds: null,
    });

    moduleFixture = await moduleBuilder.compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    stripeService = moduleFixture.get<StripeService>(StripeService);
    usageMeteringService = moduleFixture.get<UsageMeteringService>(UsageMeteringService);
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  it('processes signed invoice.paid webhook once and reconciles usage', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = Date.now().toString();
    const organization = await prisma.organization.create({
      data: {
        name: `Org Stripe ${suffix}`,
        slug: `org-stripe-${suffix}`,
        stripeCustomerId: `cus_${suffix}`,
      },
    });

    const periodStartUnix = Math.floor(new Date('2026-03-01T00:00:00.000Z').getTime() / 1000);
    const periodEndUnix = Math.floor(new Date('2026-03-31T23:59:59.000Z').getTime() / 1000);

    const eventId = `evt_invoice_paid_${suffix}`;
    const invoiceId = `in_${suffix}`;
    const payloadObject = {
      id: eventId,
      type: 'invoice.paid',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 1,
      request: null,
      data: {
        object: {
          id: invoiceId,
          object: 'invoice',
          customer: organization.stripeCustomerId,
          status: 'paid',
          currency: 'eur',
          subtotal: 12000,
          total: 12000,
          amount_due: 12000,
          amount_paid: 12000,
          billing_reason: 'subscription_cycle',
          created: periodStartUnix,
          number: `INV-${suffix}`,
          invoice_pdf: null,
          hosted_invoice_url: null,
          default_payment_method: null,
          status_transitions: {
            paid_at: periodEndUnix,
          },
          total_discount_amounts: [],
          lines: {
            object: 'list',
            data: [
              {
                id: `line_${suffix}`,
                object: 'line_item',
                description: 'Messages AI',
                amount: 12000,
                quantity: 12,
                currency: 'eur',
                period: {
                  start: periodStartUnix,
                  end: periodEndUnix,
                },
              },
            ],
          },
        },
      },
    };

    const payload = JSON.stringify(payloadObject);
    const signature = signStripePayload(payload, webhookSecret);

    await stripeService.handleWebhookEvent(Buffer.from(payload, 'utf8'), signature);
    await stripeService.handleWebhookEvent(Buffer.from(payload, 'utf8'), signature);

    const persistedInvoice = await prisma.invoice.findUnique({
      where: { stripeInvoiceId: invoiceId },
    });
    expect(persistedInvoice).toBeTruthy();
    expect(persistedInvoice?.status).toBe(InvoiceStatus.PAID);
    expect(persistedInvoice?.organizationId).toBe(organization.id);

    const invoiceCount = await prisma.invoice.count({
      where: { stripeInvoiceId: invoiceId },
    });
    expect(invoiceCount).toBe(1);

    await usageMeteringService.recordUsage({
      organizationId: organization.id,
      type: 'MESSAGE',
      quantity: 12,
      periodStart: new Date(periodStartUnix * 1000),
      periodEnd: new Date(periodEndUnix * 1000),
      idempotencyKey: `usage-${suffix}`,
      metadata: { providerEventId: eventId },
    });

    const reconciliation = await usageMeteringService.reconcileInvoiceUsage(
      organization.id,
      invoiceId,
      `reconcile-${suffix}`,
    );

    expect(reconciliation.hasMismatch).toBe(false);
    expect(
      reconciliation.differences.some(
        (d) => d.type === 'MESSAGE' && d.measured === 12 && d.billed === 12 && d.diff === 0,
      ),
    ).toBe(true);
  }, 60000);
});
