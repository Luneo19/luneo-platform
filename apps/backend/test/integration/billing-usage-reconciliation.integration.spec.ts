import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { InvoiceStatus } from '@prisma/client';
import { UsageMeteringService } from '@/modules/usage-billing/usage-metering.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import {
  closeIntegrationTestApp,
  createIntegrationTestApp,
} from '@/common/test/test-app.module';

describeIntegration('Billing Usage Reconciliation Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let usageMeteringService: UsageMeteringService;

  beforeAll(async () => {
    const testApp = await createIntegrationTestApp();
    app = testApp.app;
    moduleFixture = testApp.moduleFixture;
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    usageMeteringService = moduleFixture.get<UsageMeteringService>(UsageMeteringService);
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  it('reconciles invoice usage with strict idempotency', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = Date.now().toString();
    const periodStart = new Date('2026-02-01T00:00:00.000Z');
    const periodEnd = new Date('2026-02-28T23:59:59.999Z');

    const organization = await prisma.organization.create({
      data: {
        name: `Org Billing ${suffix}`,
        slug: `org-billing-${suffix}`,
      },
    });

    const firstUsage = await usageMeteringService.recordUsage({
      organizationId: organization.id,
      type: 'MESSAGE',
      quantity: 8,
      periodStart,
      periodEnd,
      idempotencyKey: `usage-message-${suffix}`,
      metadata: { sourceTest: 'billing-reconciliation' },
    });

    const replayUsage = await usageMeteringService.recordUsage({
      organizationId: organization.id,
      type: 'MESSAGE',
      quantity: 8,
      periodStart,
      periodEnd,
      idempotencyKey: `usage-message-${suffix}`,
      metadata: { sourceTest: 'billing-reconciliation' },
    });

    expect(replayUsage.id).toBe(firstUsage.id);

    await prisma.invoice.create({
      data: {
        organizationId: organization.id,
        stripeInvoiceId: `in_${suffix}`,
        subtotal: 100,
        total: 100,
        status: InvoiceStatus.OPEN,
        periodStart,
        periodEnd,
        items: [{ type: 'MESSAGE', quantity: 10 }],
      },
    });

    const reconciliation = await usageMeteringService.reconcileInvoiceUsage(
      organization.id,
      `in_${suffix}`,
      `reconcile-${suffix}`,
    );
    expect(reconciliation.hasMismatch).toBe(true);
    expect(reconciliation.differences.length).toBeGreaterThan(0);

    const replayReconciliation = await usageMeteringService.reconcileInvoiceUsage(
      organization.id,
      `in_${suffix}`,
      `reconcile-${suffix}`,
    );
    expect(replayReconciliation).toHaveProperty('idempotentReplay', true);
  }, 60000);
});
