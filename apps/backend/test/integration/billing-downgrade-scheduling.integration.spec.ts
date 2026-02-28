import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { OrgRole, OrgStatus, Plan } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BillingService } from '@/modules/billing/billing.service';
import { StripeClientService } from '@/modules/billing/services/stripe-client.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import {
  closeIntegrationTestApp,
  createIntegrationTestModule,
} from '@/common/test/test-app.module';

type FakeSubscription = {
  id: string;
  status: string;
  customer: string;
  items: {
    data: Array<{
      id: string;
      price: { id: string; recurring?: { interval?: string | null } };
      quantity?: number;
    }>;
  };
  current_period_end: number;
  cancel_at_period_end?: boolean;
  schedule?: string | null;
  metadata?: Record<string, string | null>;
};

describeIntegration('Billing Downgrade Scheduling Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let billingService: BillingService;

  const fakeSubscriptions = new Map<string, FakeSubscription>();
  const fakeSchedules = new Map<string, any>();

  const fakeStripe = {
    subscriptions: {
      retrieve: jest.fn(async (subscriptionId: string) => {
        const sub = fakeSubscriptions.get(subscriptionId);
        if (!sub) {
          throw new Error(`Unknown subscription ${subscriptionId}`);
        }
        return sub;
      }),
      update: jest.fn(async (subscriptionId: string, params: Record<string, unknown>) => {
        const sub = fakeSubscriptions.get(subscriptionId);
        if (!sub) {
          throw new Error(`Unknown subscription ${subscriptionId}`);
        }
        if (Array.isArray(params.items) && params.items[0] && typeof params.items[0] === 'object') {
          const nextPrice = (params.items[0] as { price?: string }).price;
          if (nextPrice) {
            sub.items.data[0].price.id = nextPrice;
          }
        }
        if (typeof params.cancel_at_period_end === 'boolean') {
          sub.cancel_at_period_end = params.cancel_at_period_end;
        }
        if (params.metadata && typeof params.metadata === 'object') {
          sub.metadata = {
            ...(sub.metadata ?? {}),
            ...(params.metadata as Record<string, string | null>),
          };
        }
        fakeSubscriptions.set(subscriptionId, sub);
        return sub;
      }),
    },
    prices: {
      retrieve: jest.fn(async (priceId: string) => {
        const monthlyMap: Record<string, number> = {
          price_pro_monthly_test: 4900,
          price_business_monthly_test: 14900,
        };
        return {
          id: priceId,
          unit_amount: monthlyMap[priceId] ?? 4900,
          recurring: { interval: 'month' },
        };
      }),
    },
    invoices: {
      retrieveUpcoming: jest.fn(async () => ({
        lines: { data: [{ proration: true, amount: -3000 }] },
        currency: 'eur',
      })),
    },
    subscriptionSchedules: {
      create: jest.fn(async ({ from_subscription }: { from_subscription: string }) => {
        const scheduleId = `sch_${Date.now()}`;
        const schedule = {
          id: scheduleId,
          from_subscription,
          phases: [{ start_date: Math.floor(Date.now() / 1000), items: [] }],
          status: 'active',
        };
        fakeSchedules.set(scheduleId, schedule);
        const sub = fakeSubscriptions.get(from_subscription);
        if (sub) {
          sub.schedule = scheduleId;
          fakeSubscriptions.set(from_subscription, sub);
        }
        return schedule;
      }),
      update: jest.fn(async (scheduleId: string, params: Record<string, unknown>) => {
        const current = fakeSchedules.get(scheduleId);
        const updated = { ...current, ...params };
        fakeSchedules.set(scheduleId, updated);
        return updated;
      }),
      retrieve: jest.fn(async (scheduleId: string) => {
        const schedule = fakeSchedules.get(scheduleId);
        if (!schedule) {
          throw new Error(`Unknown schedule ${scheduleId}`);
        }
        return schedule;
      }),
      cancel: jest.fn(async (scheduleId: string) => {
        const schedule = fakeSchedules.get(scheduleId);
        if (schedule) {
          schedule.status = 'canceled';
          fakeSchedules.set(scheduleId, schedule);
          const sub = fakeSubscriptions.get(schedule.from_subscription);
          if (sub) {
            sub.schedule = null;
            fakeSubscriptions.set(schedule.from_subscription, sub);
          }
        }
        return { id: scheduleId, status: 'canceled' };
      }),
      release: jest.fn(async (scheduleId: string) => ({
        id: scheduleId,
        status: 'released',
      })),
    },
  };

  beforeAll(async () => {
    process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pro_monthly_test';
    process.env.STRIPE_PRICE_PRO_YEARLY = 'price_pro_yearly_test';
    process.env.STRIPE_PRICE_BUSINESS_MONTHLY = 'price_business_monthly_test';
    process.env.STRIPE_PRICE_BUSINESS_YEARLY = 'price_business_yearly_test';
    process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY = 'price_enterprise_monthly_test';
    process.env.STRIPE_PRICE_ENTERPRISE_YEARLY = 'price_enterprise_yearly_test';

    const moduleBuilder = await createIntegrationTestModule();
    moduleBuilder.overrideProvider(StripeClientService).useValue({
      getStripe: jest.fn().mockResolvedValue(fakeStripe),
      executeWithResilience: jest.fn(),
      stripeConfigValid: true,
      validatedPriceIds: {
        pro: {
          monthly: 'price_pro_monthly_test',
          yearly: 'price_pro_yearly_test',
        },
        business: {
          monthly: 'price_business_monthly_test',
          yearly: 'price_business_yearly_test',
        },
        enterprise: {
          monthly: 'price_enterprise_monthly_test',
          yearly: 'price_enterprise_yearly_test',
        },
      },
    });

    moduleFixture = await moduleBuilder.compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    billingService = moduleFixture.get<BillingService>(BillingService);
  }, 60000);

  beforeEach(() => {
    fakeSubscriptions.clear();
    fakeSchedules.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  it('schedules downgrade at period end and supports cancel flow', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = Date.now().toString();
    const customerId = `cus_downgrade_${suffix}`;
    const subscriptionId = `sub_downgrade_${suffix}`;

    const org = await prisma.organization.create({
      data: {
        name: `Org Downgrade ${suffix}`,
        slug: `org-downgrade-${suffix}`,
        plan: Plan.BUSINESS,
        status: OrgStatus.ACTIVE,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `downgrade-${suffix}@example.com`,
        firstName: 'Downgrade',
        lastName: 'Tester',
        emailVerified: true,
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: OrgRole.OWNER,
        isActive: true,
      },
    });

    fakeSubscriptions.set(subscriptionId, {
      id: subscriptionId,
      status: 'active',
      customer: customerId,
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: {
        data: [
          {
            id: `si_${suffix}`,
            price: {
              id: 'price_business_monthly_test',
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
      },
      cancel_at_period_end: false,
      schedule: null,
      metadata: {},
    });

    const change = await billingService.changePlan(user.id, 'pro', {
      billingInterval: 'monthly',
    });

    expect(change.success).toBe(true);
    expect(change.type).toBe('downgrade');

    const scheduled = await billingService.getScheduledPlanChanges(user.id);
    expect(scheduled.hasScheduledChanges).toBe(true);
    expect(scheduled.scheduledChanges?.type).toBe('downgrade');
    expect(scheduled.scheduledChanges?.newPlan).toBe('pro');

    const cancel = await billingService.cancelScheduledDowngrade(user.id);
    expect(cancel.success).toBe(true);

    const afterCancel = await billingService.getScheduledPlanChanges(user.id);
    expect(afterCancel.hasScheduledChanges).toBe(false);
  }, 60000);

  it('replaces existing scheduled downgrade when interval context changes', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = `${Date.now()}-reschedule`;
    const customerId = `cus_downgrade_${suffix}`;
    const subscriptionId = `sub_downgrade_${suffix}`;

    const org = await prisma.organization.create({
      data: {
        name: `Org Downgrade ${suffix}`,
        slug: `org-downgrade-${suffix}`,
        plan: Plan.BUSINESS,
        status: OrgStatus.ACTIVE,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `downgrade-${suffix}@example.com`,
        firstName: 'Downgrade',
        lastName: 'Rescheduler',
        emailVerified: true,
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: OrgRole.OWNER,
        isActive: true,
      },
    });

    fakeSubscriptions.set(subscriptionId, {
      id: subscriptionId,
      status: 'active',
      customer: customerId,
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: {
        data: [
          {
            id: `si_${suffix}`,
            price: {
              id: 'price_business_monthly_test',
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
      },
      cancel_at_period_end: false,
      schedule: null,
      metadata: {},
    });

    const firstChange = await billingService.changePlan(user.id, 'pro', {
      billingInterval: 'monthly',
    });
    expect(firstChange.success).toBe(true);
    expect(firstChange.type).toBe('downgrade');

    const subAfterFirst = fakeSubscriptions.get(subscriptionId);
    const firstScheduleId = subAfterFirst?.schedule;
    expect(firstScheduleId).toBeTruthy();

    const secondChange = await billingService.changePlan(user.id, 'pro', {
      billingInterval: 'yearly',
    });
    expect(secondChange.success).toBe(true);
    expect(secondChange.type).toBe('downgrade');

    expect(fakeStripe.subscriptionSchedules.release).toHaveBeenCalledTimes(1);
    expect(fakeStripe.subscriptionSchedules.release).toHaveBeenCalledWith(firstScheduleId);

    const subAfterSecond = fakeSubscriptions.get(subscriptionId);
    const secondScheduleId = subAfterSecond?.schedule;
    expect(secondScheduleId).toBeTruthy();
    expect(secondScheduleId).not.toBe(firstScheduleId);

    const secondSchedule = fakeSchedules.get(secondScheduleId as string);
    const futurePhasePriceId = secondSchedule?.phases?.[1]?.items?.[0]?.price;
    expect(futurePhasePriceId).toBe('price_pro_yearly_test');

    const scheduled = await billingService.getScheduledPlanChanges(user.id);
    expect(scheduled.hasScheduledChanges).toBe(true);
    expect(scheduled.scheduledChanges?.type).toBe('downgrade');
    expect(scheduled.scheduledChanges?.newPlan).toBe('pro');
  }, 60000);

  it('reports cancel_at_period_end as scheduled cancellation change', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = `${Date.now()}-cancel`;
    const customerId = `cus_cancel_${suffix}`;
    const subscriptionId = `sub_cancel_${suffix}`;

    const org = await prisma.organization.create({
      data: {
        name: `Org Cancel ${suffix}`,
        slug: `org-cancel-${suffix}`,
        plan: Plan.PRO,
        status: OrgStatus.ACTIVE,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `cancel-${suffix}@example.com`,
        firstName: 'Cancel',
        lastName: 'Tester',
        emailVerified: true,
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: OrgRole.OWNER,
        isActive: true,
      },
    });

    const periodEnd = Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60;
    fakeSubscriptions.set(subscriptionId, {
      id: subscriptionId,
      status: 'active',
      customer: customerId,
      current_period_end: periodEnd,
      items: {
        data: [
          {
            id: `si_${suffix}`,
            price: {
              id: 'price_pro_monthly_test',
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
      },
      cancel_at_period_end: true,
      schedule: null,
      metadata: {},
    });

    const scheduled = await billingService.getScheduledPlanChanges(user.id);
    expect(scheduled.hasScheduledChanges).toBe(true);
    expect(scheduled.scheduledChanges?.type).toBe('cancel');
    expect(scheduled.scheduledChanges?.reason).toBe('Subscription scheduled for cancellation');
    expect(scheduled.scheduledChanges?.effectiveDate).toBeTruthy();
    expect(scheduled.currentPlan).toBe('pro');
  }, 60000);
});
