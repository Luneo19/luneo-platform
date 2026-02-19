import { Injectable, Logger, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { UsageMetricType } from '@/modules/usage-billing/interfaces/usage.interface';
import { UsageMeteringService } from '@/modules/usage-billing/services/usage-metering.service';
import { PCE_EVENTS } from '../pce.constants';

interface PCEPipelinePayload {
  pipelineId: string;
  orderId: string;
  brandId: string;
}

interface PCERenderPayload {
  renderJobId: string;
  orderId?: string;
  brandId?: string;
}

interface PCEProductionPayload {
  productionOrderId: string;
  orderId?: string;
  brandId?: string;
}

interface PCEFulfillmentPayload {
  fulfillmentId: string;
  orderId?: string;
  brandId?: string;
  pipelineId?: string;
}

/**
 * Listens for PCE events and records usage for billing when UsageMeteringService is available.
 * If the usage-billing module is not imported, logs only (no-op).
 */
@Injectable()
export class UsageEventListener {
  private readonly logger = new Logger(UsageEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly usageMeteringService: UsageMeteringService | null,
  ) {}

  private async recordIfAvailable(
    brandId: string,
    metric: UsageMetricType,
    value: number = 1,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.usageMeteringService) {
      this.logger.debug(`Usage not recorded (UsageMeteringService not available): ${metric}=${value} brand=${brandId}`);
      return;
    }
    try {
      await this.usageMeteringService.recordUsage(brandId, metric, value, metadata);
    } catch (err) {
      this.logger.warn(
        `Failed to record PCE usage ${metric}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async resolveBrandId(payload: { brandId?: string; orderId?: string; pipelineId?: string; renderJobId?: string; fulfillmentId?: string; productionOrderId?: string }): Promise<string | null> {
    if (payload.brandId) return payload.brandId;
    if (payload.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: payload.orderId }, select: { brandId: true } });
      return order?.brandId ?? null;
    }
    if (payload.pipelineId) {
      const p = await this.prisma.pipeline.findUnique({ where: { id: payload.pipelineId }, select: { brandId: true } });
      return p?.brandId ?? null;
    }
    if (payload.renderJobId) {
      const r = await this.prisma.renderJob.findUnique({ where: { id: payload.renderJobId }, select: { brandId: true } });
      return r?.brandId ?? null;
    }
    if (payload.fulfillmentId) {
      const f = await this.prisma.fulfillment.findUnique({ where: { id: payload.fulfillmentId }, select: { brandId: true } });
      return f?.brandId ?? null;
    }
    if (payload.productionOrderId) {
      const po = await this.prisma.productionOrder.findUnique({ where: { id: payload.productionOrderId }, select: { brandId: true } });
      return po?.brandId ?? null;
    }
    return null;
  }

  @OnEvent(PCE_EVENTS.PIPELINE_COMPLETED)
  async onPipelineCompleted(payload: PCEPipelinePayload) {
    const brandId = await this.resolveBrandId(payload);
    if (!brandId) return;
    await this.recordIfAvailable(brandId, 'pce_orders_processed', 1, {
      pipelineId: payload.pipelineId,
      orderId: payload.orderId,
    });
  }

  @OnEvent(PCE_EVENTS.RENDER_COMPLETED)
  async onRenderCompleted(payload: PCERenderPayload) {
    const brandId = await this.resolveBrandId({ ...payload, renderJobId: payload.renderJobId });
    if (!brandId) return;
    await this.recordIfAvailable(brandId, 'pce_renders', 1, {
      renderJobId: payload.renderJobId,
      orderId: payload.orderId,
    });
  }

  @OnEvent(PCE_EVENTS.PRODUCTION_SUBMITTED)
  async onProductionSubmitted(payload: PCEProductionPayload) {
    const brandId = await this.resolveBrandId({ ...payload, productionOrderId: payload.productionOrderId });
    if (!brandId) return;
    await this.recordIfAvailable(brandId, 'pce_production_orders', 1, {
      productionOrderId: payload.productionOrderId,
      orderId: payload.orderId,
    });
  }

  @OnEvent(PCE_EVENTS.FULFILLMENT_SHIPPED)
  async onFulfillmentShipped(payload: PCEFulfillmentPayload) {
    const brandId = await this.resolveBrandId({ ...payload, fulfillmentId: payload.fulfillmentId });
    if (!brandId) return;
    await this.recordIfAvailable(brandId, 'pce_fulfillments', 1, {
      fulfillmentId: payload.fulfillmentId,
      orderId: payload.orderId,
    });
  }
}
