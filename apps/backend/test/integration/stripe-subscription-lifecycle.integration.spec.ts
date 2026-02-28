import * as crypto from 'crypto';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import Stripe from 'stripe';
import { OrgStatus, Plan } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StripeService } from '@/modules/billing/stripe.service';
import { StripeClientService } from '@/modules/billing/services/stripe-client.service';
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

describeIntegration('Stripe Subscription Lifecycle Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let stripeService: StripeService;

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock_secret_for_testing';
  const stripe = new Stripe('sk_test_mock_key_for_testing', {
    apiVersion: '2023-10-16',
  });

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
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  it('applies subscription.updated then subscription.deleted with correct org state transitions', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = Date.now().toString();
    const customerId = `cus_lifecycle_${suffix}`;
    const subscriptionId = `sub_lifecycle_${suffix}`;
    const periodEndUnix = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    const org = await prisma.organization.create({
      data: {
        name: `Org Lifecycle ${suffix}`,
        slug: `org-lifecycle-${suffix}`,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan: Plan.FREE,
        status: OrgStatus.ACTIVE,
      },
    });

    const updatedEvent = {
      id: `evt_sub_updated_${suffix}`,
      type: 'customer.subscription.updated',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 1,
      request: null,
      data: {
        object: {
          id: subscriptionId,
          object: 'subscription',
          customer: customerId,
          status: 'active',
          current_period_end: periodEndUnix,
          metadata: { plan: 'pro' },
          items: {
            object: 'list',
            data: [
              {
                id: `si_${suffix}`,
                object: 'subscription_item',
                price: {
                  id: `price_${suffix}`,
                  metadata: { plan: 'pro' },
                },
              },
            ],
          },
        },
      },
    };

    const updatedPayload = JSON.stringify(updatedEvent);
    const updatedSig = signStripePayload(updatedPayload, webhookSecret);

    await stripeService.handleWebhookEvent(
      Buffer.from(updatedPayload, 'utf8'),
      updatedSig,
    );
    // Replay same event id -> should be ignored by idempotency
    await stripeService.handleWebhookEvent(
      Buffer.from(updatedPayload, 'utf8'),
      updatedSig,
    );

    const afterUpdated = await prisma.organization.findUnique({
      where: { id: org.id },
      select: {
        plan: true,
        status: true,
        stripeSubscriptionId: true,
        planPeriodEnd: true,
      },
    });

    expect(afterUpdated?.plan).toBe(Plan.PRO);
    expect(afterUpdated?.status).toBe(OrgStatus.ACTIVE);
    expect(afterUpdated?.stripeSubscriptionId).toBe(subscriptionId);
    expect(afterUpdated?.planPeriodEnd).toBeTruthy();

    const deletedEvent = {
      id: `evt_sub_deleted_${suffix}`,
      type: 'customer.subscription.deleted',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 1,
      request: null,
      data: {
        object: {
          id: subscriptionId,
          object: 'subscription',
          customer: customerId,
          status: 'canceled',
        },
      },
    };

    const deletedPayload = JSON.stringify(deletedEvent);
    const deletedSig = signStripePayload(deletedPayload, webhookSecret);

    await stripeService.handleWebhookEvent(
      Buffer.from(deletedPayload, 'utf8'),
      deletedSig,
    );

    const afterDeleted = await prisma.organization.findUnique({
      where: { id: org.id },
      select: {
        plan: true,
        status: true,
        stripeSubscriptionId: true,
        planPeriodEnd: true,
      },
    });

    expect(afterDeleted?.plan).toBe(Plan.FREE);
    expect(afterDeleted?.status).toBe(OrgStatus.ACTIVE);
    expect(afterDeleted?.stripeSubscriptionId).toBeNull();
    expect(afterDeleted?.planPeriodEnd).toBeNull();
  }, 60000);
});
