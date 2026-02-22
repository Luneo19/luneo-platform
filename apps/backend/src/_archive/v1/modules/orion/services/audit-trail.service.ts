// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

interface AuditEntry {
  eventType: string;
  agentType: string;
  action: string;
  ticketId?: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
}

interface AuditFilters {
  agentType?: string;
  eventType?: string;
  ticketId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: `orion.${entry.agentType}.${entry.eventType}`,
          action: entry.action,
          userId: entry.userId,
          resourceType: entry.resourceType || 'ticket',
          resourceId: entry.resourceId || entry.ticketId || '',
          metadata: {
            agentType: entry.agentType,
            ticketId: entry.ticketId,
            ...entry.metadata,
          } as unknown as Prisma.InputJsonValue,
          success: entry.success ?? true,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log audit entry: ${error}`);
    }
  }

  async logAIDecision(params: {
    agentType: string;
    action: string;
    ticketId: string;
    modelUsed: string;
    confidence: number;
    decision: string;
    userId?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'ai_decision',
      agentType: params.agentType,
      action: params.action,
      ticketId: params.ticketId,
      userId: params.userId,
      metadata: {
        modelUsed: params.modelUsed,
        confidence: params.confidence,
        decision: params.decision,
      },
    });
  }

  async logReview(params: {
    ticketId: string;
    responseId: string;
    reviewerId: string;
    approved: boolean;
    notes?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'review',
      agentType: 'prometheus',
      action: params.approved ? 'response_approved' : 'response_rejected',
      ticketId: params.ticketId,
      userId: params.reviewerId,
      resourceId: params.responseId,
      metadata: {
        approved: params.approved,
        notes: params.notes,
      },
    });
  }

  async getAuditLogs(filters: AuditFilters = {}) {
    const { page = 1, limit = 50 } = filters;

    const where: Record<string, unknown> = {};
    if (filters.agentType) {
      where.eventType = { startsWith: `orion.${filters.agentType}` };
    }
    if (filters.eventType) {
      where.eventType = { contains: filters.eventType };
    }
    if (filters.ticketId) {
      where.resourceId = filters.ticketId;
    }
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        (where.timestamp as Record<string, unknown>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (where.timestamp as Record<string, unknown>).lte = filters.endDate;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: where as never,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: where as never }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exportAuditLogs(
    filters: AuditFilters,
    format: 'csv' | 'json' = 'json',
  ): Promise<string> {
    const result = await this.getAuditLogs({ ...filters, limit: 10000, page: 1 });

    if (format === 'json') {
      return JSON.stringify(result.items, null, 2);
    }

    const headers = [
      'id',
      'eventType',
      'action',
      'userId',
      'resourceType',
      'resourceId',
      'success',
      'timestamp',
    ];
    const rows = result.items.map((item) =>
      headers.map((h) => String((item as Record<string, unknown>)[h] ?? '')).join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
