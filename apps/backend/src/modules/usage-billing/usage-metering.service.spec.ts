import { ForbiddenException } from '@nestjs/common';
import { UsageType } from '@prisma/client';
import { UsageMeteringService } from './usage-metering.service';

describe('UsageMeteringService (current module)', () => {
  const prisma = {
    usageRecord: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
    },
  };

  const service = new UsageMeteringService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejette une quantity <= 0', async () => {
    await expect(
      service.recordUsage({
        organizationId: 'org-1',
        type: UsageType.API_CALL,
        quantity: 0,
      }),
    ).rejects.toThrow('quantity doit être un entier strictement positif');
  });

  it('retourne la ligne existante quand idempotencyKey déjà vue', async () => {
    const existing = { id: 'usage-existing' };
    prisma.usageRecord.findFirst.mockResolvedValue(existing);

    const result = await service.recordUsage({
      organizationId: 'org-1',
      type: UsageType.API_CALL,
      quantity: 1,
      idempotencyKey: 'idem-1',
    });

    expect(result).toBe(existing);
    expect(prisma.usageRecord.create).not.toHaveBeenCalled();
  });

  it('bloque la réconciliation cross-tenant', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      organizationId: 'org-other',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
      items: [],
      total: 100,
    });

    await expect(
      service.reconcileInvoiceUsage('org-1', 'stripe-inv-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('renvoie idempotentReplay si la reconciliation est déjà enregistrée', async () => {
    prisma.usageRecord.findFirst.mockResolvedValue({ id: 'marker' });

    const result = await service.reconcileInvoiceUsage(
      'org-1',
      'stripe-inv-1',
      'reco-idem-1',
    );

    expect((result as { idempotentReplay?: boolean }).idempotentReplay).toBe(
      true,
    );
  });
});

