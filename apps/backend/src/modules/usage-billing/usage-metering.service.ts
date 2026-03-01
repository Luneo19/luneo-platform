import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { Prisma, UsageType } from '@prisma/client';
import { createHash } from 'crypto';

export interface MeteringRecordInput {
  organizationId: string;
  type: UsageType;
  quantity: number;
  periodStart?: Date;
  periodEnd?: Date;
  agentId?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  source?: string;
}

@Injectable()
export class UsageMeteringService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async recordUsage(input: MeteringRecordInput) {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new BadRequestException('quantity doit être un entier strictement positif');
    }
    if (input.quantity > 1_000_000) {
      throw new BadRequestException('quantity dépasse la limite maximale autorisée');
    }

    const now = new Date();
    const periodStart =
      input.periodStart ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd =
      input.periodEnd ??
      new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const metadata = {
      ...(input.metadata ?? {}),
      source: input.source ?? 'backend',
    } as Record<string, unknown>;
    const idempotencyKey = this.resolveIdempotencyKey(input, periodStart, periodEnd);
    if (idempotencyKey) {
      metadata.idempotencyKey = idempotencyKey;
      const existing = await this.prisma.usageRecord.findFirst({
        where: {
          organizationId: input.organizationId,
          type: input.type,
          periodStart,
          periodEnd,
          metadata: {
            path: ['idempotencyKey'],
            equals: idempotencyKey,
          } as Prisma.JsonFilter,
        },
      });
      if (existing) {
        return existing;
      }
    }

    return this.prisma.usageRecord.create({
      data: {
        organizationId: input.organizationId,
        type: input.type,
        quantity: input.quantity,
        periodStart,
        periodEnd,
        agentId: input.agentId,
        conversationId: input.conversationId,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  async getUsageLedger(
    organizationId: string,
    dateRange?: { from: Date; to: Date },
  ) {
    const where = {
      organizationId,
      ...(dateRange
        ? { createdAt: { gte: dateRange.from, lte: dateRange.to } }
        : {}),
    };

    const [rows, totals] = await Promise.all([
      this.prisma.usageRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      this.prisma.usageRecord.groupBy({
        by: ['type'],
        where,
        _sum: { quantity: true },
      }),
    ]);

    return {
      entries: rows,
      totals: totals.map((x) => ({
        type: x.type,
        quantity: x._sum.quantity ?? 0,
      })),
    };
  }

  async reconcileInvoiceUsage(
    organizationId: string,
    stripeInvoiceId: string,
    idempotencyKey?: string,
  ) {
    const scopedIdempotencyKey = idempotencyKey?.trim();
    if (scopedIdempotencyKey) {
      const existing = await this.prisma.usageRecord.findFirst({
        where: {
          organizationId,
          type: 'API_CALL',
          metadata: {
            path: ['reconcileInvoiceIdempotencyKey'],
            equals: scopedIdempotencyKey,
          } as Prisma.JsonFilter,
        },
      });
      if (existing) {
        return {
          invoiceId: stripeInvoiceId,
          stripeInvoiceId,
          differences: [],
          hasMismatch: false,
          idempotentReplay: true,
        };
      }
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { stripeInvoiceId },
      select: {
        id: true,
        organizationId: true,
        periodStart: true,
        periodEnd: true,
        items: true,
        total: true,
      },
    });
    if (!invoice) {
      throw new Error('Facture introuvable');
    }
    if (invoice.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Accès interdit: la facture ne correspond pas à l’organisation appelante',
      );
    }

    const metered = await this.prisma.usageRecord.groupBy({
      by: ['type'],
      where: {
        organizationId,
        createdAt: { gte: invoice.periodStart, lte: invoice.periodEnd },
      },
      _sum: { quantity: true },
    });

    const billedItemsRaw = Array.isArray(invoice.items) ? invoice.items : [];

    const billedByType = new Map<string, number>();
    for (const item of billedItemsRaw) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        continue;
      }
      const type = typeof item['type'] === 'string' ? item['type'] : 'UNKNOWN';
      const quantity = typeof item['quantity'] === 'number' ? item['quantity'] : 0;
      billedByType.set(type, quantity);
    }

    const diffs = metered.map((m) => {
      const measured = m._sum.quantity ?? 0;
      const billed = billedByType.get(m.type) ?? 0;
      return {
        type: m.type,
        measured,
        billed,
        diff: measured - billed,
      };
    });

    const response = {
      invoiceId: invoice.id,
      stripeInvoiceId,
      invoiceTotal: invoice.total,
      differences: diffs,
      hasMismatch: diffs.some((d) => d.diff !== 0),
    };

    if (scopedIdempotencyKey) {
      await this.prisma.usageRecord.create({
        data: {
          organizationId,
          type: 'API_CALL',
          quantity: 1,
          periodStart: invoice.periodStart,
          periodEnd: invoice.periodEnd,
          metadata: {
            source: 'reconciliation',
            reconcileInvoiceIdempotencyKey: scopedIdempotencyKey,
            stripeInvoiceId,
            hasMismatch: response.hasMismatch,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return response;
  }

  private resolveIdempotencyKey(
    input: MeteringRecordInput,
    periodStart: Date,
    periodEnd: Date,
  ): string | undefined {
    const metadataIdempotency =
      typeof input.metadata?.idempotencyKey === 'string'
        ? input.metadata.idempotencyKey
        : undefined;
    const providerEventId =
      typeof input.metadata?.providerEventId === 'string'
        ? input.metadata.providerEventId
        : typeof input.metadata?.messageId === 'string'
          ? input.metadata.messageId
          : undefined;
    const provided = (input.idempotencyKey ?? metadataIdempotency ?? providerEventId)?.trim();
    if (provided) {
      return provided;
    }
    if (!input.conversationId && !input.agentId) {
      return undefined;
    }
    return createHash('sha256')
      .update(
        [
          input.organizationId,
          input.type,
          String(input.quantity),
          input.agentId ?? '',
          input.conversationId ?? '',
          periodStart.toISOString(),
          periodEnd.toISOString(),
        ].join(':'),
      )
      .digest('hex');
  }
}

