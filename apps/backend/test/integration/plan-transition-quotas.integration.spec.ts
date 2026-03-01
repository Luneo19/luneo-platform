import * as crypto from 'crypto';
import { ForbiddenException, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { OrgStatus, Plan, UsageType } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StripeService } from '@/modules/billing/stripe.service';
import { StripeClientService } from '@/modules/billing/services/stripe-client.service';
import { QuotasService } from '@/modules/quotas/quotas.service';
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

describeIntegration('Plan Transition Quotas Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let stripeService: StripeService;
  let quotasService: QuotasService;

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock_secret_for_testing';
  const stripe = new Stripe('sk_test_mock_key_for_testing', {
    apiVersion: '2023-10-16',
  });

  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
    process.env.REVENUE_PRO_OVERAGE_CONVERSATIONS_CAP = '2';
    process.env.REVENUE_PRO_OVERAGE_MESSAGES_CAP = '3';

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
    quotasService = moduleFixture.get<QuotasService>(QuotasService);
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  it('unblocks conversations quota right after subscription upgrade updates limits', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = `${Date.now()}-upgrade`;
    const customerId = `cus_quota_upgrade_${suffix}`;
    const subscriptionId = `sub_quota_upgrade_${suffix}`;

    const org = await prisma.organization.create({
      data: {
        name: `Org Quota Upgrade ${suffix}`,
        slug: `org-quota-upgrade-${suffix}`,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan: Plan.FREE,
        status: OrgStatus.ACTIVE,
        conversationsUsed: 50,
        conversationsLimit: 50,
        agentsLimit: 1,
      },
    });

    await expect(
      quotasService.enforceQuota(org.id, 'conversations', 1),
    ).rejects.toThrow(ForbiddenException);

    const updatedEvent = {
      id: `evt_quota_sub_updated_${suffix}`,
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
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
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

    const afterUpgrade = await prisma.organization.findUnique({
      where: { id: org.id },
      select: {
        plan: true,
        conversationsLimit: true,
        agentsLimit: true,
      },
    });

    expect(afterUpgrade?.plan).toBe(Plan.PRO);
    expect(afterUpgrade?.conversationsLimit).toBe(2000);
    expect(afterUpgrade?.agentsLimit).toBe(5);

    await expect(
      quotasService.enforceQuota(org.id, 'conversations', 1),
    ).resolves.toBeUndefined();
  }, 60000);

  it('re-blocks quota checks right after downgrade to FREE', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = `${Date.now()}-downgrade`;
    const customerId = `cus_quota_downgrade_${suffix}`;
    const subscriptionId = `sub_quota_downgrade_${suffix}`;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const org = await prisma.organization.create({
      data: {
        name: `Org Quota Downgrade ${suffix}`,
        slug: `org-quota-downgrade-${suffix}`,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan: Plan.PRO,
        status: OrgStatus.ACTIVE,
        conversationsUsed: 1200,
        conversationsLimit: 2000,
        agentsLimit: 5,
      },
    });

    await prisma.usageRecord.create({
      data: {
        organizationId: org.id,
        type: UsageType.MESSAGE,
        quantity: 1500,
        periodStart,
        periodEnd,
      },
    });

    await expect(
      quotasService.enforceQuota(org.id, 'conversations', 1),
    ).resolves.toBeUndefined();
    await expect(
      quotasService.enforceQuota(org.id, 'messages_ai', 1),
    ).resolves.toBeUndefined();

    const deletedEvent = {
      id: `evt_quota_sub_deleted_${suffix}`,
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

    const afterDowngrade = await prisma.organization.findUnique({
      where: { id: org.id },
      select: {
        plan: true,
        conversationsLimit: true,
        agentsLimit: true,
      },
    });

    expect(afterDowngrade?.plan).toBe(Plan.FREE);
    expect(afterDowngrade?.conversationsLimit).toBe(100);
    expect(afterDowngrade?.agentsLimit).toBe(1);

    await expect(
      quotasService.enforceQuota(org.id, 'conversations', 1),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      quotasService.enforceQuota(org.id, 'messages_ai', 1),
    ).rejects.toThrow(ForbiddenException);
  }, 60000);

  it('applies credits_pack add-on exactly once and unblocks conversation quota', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = `${Date.now()}-addons`;
    const org = await prisma.organization.create({
      data: {
        name: `Org Quota Addon ${suffix}`,
        slug: `org-quota-addon-${suffix}`,
        plan: Plan.FREE,
        status: OrgStatus.ACTIVE,
        conversationsUsed: 120,
        conversationsLimit: 100,
      },
    });

    await expect(
      quotasService.enforceQuota(org.id, 'conversations', 1),
    ).rejects.toThrow(ForbiddenException);

    const event = {
      id: `evt_quota_checkout_completed_${suffix}`,
      type: 'checkout.session.completed',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 1,
      request: null,
      data: {
        object: {
          id: `cs_${suffix}`,
          object: 'checkout.session',
          customer: `cus_${suffix}`,
          payment_status: 'paid',
          metadata: {
            kind: 'credits_pack',
            credits: '250',
            organizationId: org.id,
          },
        },
      },
    };

    const payload = JSON.stringify(event);
    const signature = signStripePayload(payload, webhookSecret);
    await stripeService.handleWebhookEvent(Buffer.from(payload, 'utf8'), signature);
    await stripeService.handleWebhookEvent(Buffer.from(payload, 'utf8'), signature);

    const afterTopup = await prisma.organization.findUnique({
      where: { id: org.id },
      select: { conversationsLimit: true },
    });

    expect(afterTopup?.conversationsLimit).toBe(350);
    await expect(
      quotasService.enforceQuota(org.id, 'conversations', 1),
    ).resolves.toBeUndefined();
  }, 60000);

  it('enforces PRO overage caps for conversations and AI messages', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = `${Date.now()}-overage`;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const org = await prisma.organization.create({
      data: {
        name: `Org Quota Overage ${suffix}`,
        slug: `org-quota-overage-${suffix}`,
        plan: Plan.PRO,
        status: OrgStatus.ACTIVE,
        conversationsUsed: 2000,
        conversationsLimit: 2000,
        agentsLimit: 5,
      },
    });

    await prisma.usageRecord.create({
      data: {
        organizationId: org.id,
        type: UsageType.MESSAGE,
        quantity: 20000,
        periodStart,
        periodEnd,
      },
    });

    await expect(
      quotasService.enforceQuota(org.id, 'conversations', 2),
    ).resolves.toBeUndefined();
    await expect(
      quotasService.enforceQuota(org.id, 'conversations', 3),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      quotasService.enforceQuota(org.id, 'messages_ai', 3),
    ).resolves.toBeUndefined();
    await expect(
      quotasService.enforceQuota(org.id, 'messages_ai', 4),
    ).rejects.toThrow(ForbiddenException);
  }, 60000);
});
