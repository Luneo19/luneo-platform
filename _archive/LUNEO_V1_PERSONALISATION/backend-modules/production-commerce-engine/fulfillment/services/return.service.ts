import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ReturnStatus, RefundStatus } from '@prisma/client';
import { PCE_EVENTS } from '../../pce.constants';

export interface CreateReturnParams {
  orderId: string;
  fulfillmentId?: string;
  reason: string;
  reasonDetails?: string;
  items: unknown[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessReturnAction {
  action: ReturnStatus;
  notes?: string;
}

@Injectable()
export class ReturnService {
  private readonly logger = new Logger(ReturnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createReturn(brandId: string, params: CreateReturnParams) {
    const ret = await this.prisma.return.create({
      data: {
        brandId,
        orderId: params.orderId,
        fulfillmentId: params.fulfillmentId,
        reason: params.reason,
        reasonDetails: params.reasonDetails,
        items: params.items as object,
        notes: params.notes,
        metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        status: ReturnStatus.REQUESTED,
      },
    });

    this.eventEmitter.emit(PCE_EVENTS.RETURN_REQUESTED, {
      returnId: ret.id,
      orderId: ret.orderId,
      brandId,
    });
    this.logger.log(`Return created: ${ret.id} for order ${params.orderId}`);
    return ret;
  }

  async getReturn(id: string, brandId: string) {
    const ret = await this.prisma.return.findUnique({
      where: { id },
    });
    if (!ret) {
      throw new NotFoundException(`Return ${id} not found`);
    }
    if (ret.brandId !== brandId) {
      throw new NotFoundException(`Return ${id} not found`);
    }
    return ret;
  }

  async listReturns(
    brandId: string,
    filters: { status?: ReturnStatus; limit?: number; offset?: number } = {},
  ) {
    const { status, limit = 20, offset = 0 } = filters;
    const where: { brandId: string; status?: ReturnStatus } = { brandId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.return.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.return.count({ where }),
    ]);
    return { items, total };
  }

  async processReturn(
    id: string,
    brandId: string,
    action: ReturnStatus,
    notes?: string,
  ) {
    const ret = await this.getReturn(id, brandId);

    const updated = await this.prisma.return.update({
      where: { id },
      data: {
        status: action,
        notes: notes ?? ret.notes,
        receivedAt: action === ReturnStatus.RECEIVED ? new Date() : undefined,
        inspectedAt: action === ReturnStatus.INSPECTED ? new Date() : undefined,
      },
    });

    if (action === ReturnStatus.APPROVED) {
      this.eventEmitter.emit(PCE_EVENTS.RETURN_APPROVED, {
        returnId: id,
        orderId: ret.orderId,
        brandId,
      });
    }
    if (action === ReturnStatus.RECEIVED) {
      this.eventEmitter.emit(PCE_EVENTS.RETURN_RECEIVED, {
        returnId: id,
        orderId: ret.orderId,
        brandId,
      });
    }

    this.logger.log(`Return ${id} processed: ${action}`);
    return updated;
  }

  async markAsReceived(id: string, brandId: string) {
    return this.processReturn(id, brandId, ReturnStatus.RECEIVED);
  }

  async processRefund(
    id: string,
    brandId: string,
    refundAmountCents: number,
    notes?: string,
  ) {
    const ret = await this.getReturn(id, brandId);

    const refundStatus: RefundStatus =
      refundAmountCents <= 0
        ? RefundStatus.REJECTED
        : RefundStatus.FULL;

    const updated = await this.prisma.return.update({
      where: { id },
      data: {
        refundStatus,
        refundAmountCents,
        refundedAt: new Date(),
        notes: notes ?? ret.notes,
        status: ReturnStatus.REFUNDED,
      },
    });

    this.eventEmitter.emit(PCE_EVENTS.RETURN_REFUNDED, {
      returnId: id,
      orderId: ret.orderId,
      brandId,
      refundAmountCents,
    });
    this.logger.log(`Return ${id} refunded: ${refundAmountCents} cents`);
    return updated;
  }

  async getReturnLabel(id: string, brandId: string): Promise<unknown> {
    const ret = await this.getReturn(id, brandId);
    return ret.returnLabel;
  }
}
