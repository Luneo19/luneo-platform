import { Injectable, Logger, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PCE_EVENTS } from '../pce.constants';

export interface SyncTriggerParams {
  connectionId: string;
  type: 'sync-products' | 'sync-orders' | 'sync-inventory' | 'sync-full';
  options?: Record<string, unknown>;
}

export interface ConnectionInfo {
  id: string;
  brandId: string;
  platform: string;
  shopDomain: string;
  status: string;
  lastSyncAt: Date | null;
}

export interface SyncResult {
  success: boolean;
  itemsProcessed?: number;
  itemsFailed?: number;
  error?: string;
  durationMs?: number;
}

/**
 * Bridges PCE to the existing ecommerce module.
 * Translates ecommerce sync events to PCE events; optionally delegates to ProductSyncService/OrderSyncService when EcommerceModule is imported.
 */
@Injectable()
export class EcommerceBridgeService {
  private readonly logger = new Logger(EcommerceBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly productSyncService?: { syncProducts: (req: { integrationId: string; brandId?: string }) => Promise<{ itemsProcessed: number; itemsFailed?: number }> },
    @Optional() private readonly orderSyncService?: { syncOrders: (req: { integrationId: string }) => Promise<{ itemsProcessed: number; itemsFailed: number }> },
  ) {}

  /**
   * Sync products for an integration (connection).
   * Returns result for PCE sync processor to log in SyncLog.
   */
  async syncProducts(connectionId: string): Promise<SyncResult> {
    this.eventEmitter.emit(PCE_EVENTS.SYNC_STARTED, { connectionId, type: 'products' });
    const start = Date.now();
    try {
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: connectionId },
      });
      if (!integration) {
        throw new Error(`Integration not found: ${connectionId}`);
      }
      if (this.productSyncService) {
        const result = await this.productSyncService.syncProducts({
          integrationId: connectionId,
          brandId: integration.brandId,
        });
        this.eventEmitter.emit(PCE_EVENTS.SYNC_COMPLETED, { connectionId, type: 'products' });
        return {
          success: true,
          itemsProcessed: result.itemsProcessed,
          itemsFailed: result.itemsFailed ?? 0,
          durationMs: Date.now() - start,
        };
      }
      this.logger.log(`Sync products (no ProductSyncService): ${connectionId}`);
      return { success: true, itemsProcessed: 0, durationMs: Date.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.eventEmitter.emit(PCE_EVENTS.SYNC_FAILED, { connectionId, type: 'products', error: message });
      return { success: false, error: message, durationMs: Date.now() - start };
    }
  }

  /**
   * Sync orders for an integration.
   */
  async syncOrders(connectionId: string): Promise<SyncResult> {
    this.eventEmitter.emit(PCE_EVENTS.SYNC_STARTED, { connectionId, type: 'orders' });
    const start = Date.now();
    try {
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: connectionId },
      });
      if (!integration) {
        throw new Error(`Integration not found: ${connectionId}`);
      }
      if (this.orderSyncService) {
        const result = await this.orderSyncService.syncOrders({ integrationId: connectionId });
        this.eventEmitter.emit(PCE_EVENTS.SYNC_COMPLETED, { connectionId, type: 'orders' });
        return {
          success: result.itemsFailed === 0,
          itemsProcessed: result.itemsProcessed,
          itemsFailed: result.itemsFailed,
          durationMs: Date.now() - start,
        };
      }
      this.logger.log(`Sync orders (no OrderSyncService): ${connectionId}`);
      return { success: true, itemsProcessed: 0, durationMs: Date.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.eventEmitter.emit(PCE_EVENTS.SYNC_FAILED, { connectionId, type: 'orders', error: message });
      return { success: false, error: message, durationMs: Date.now() - start };
    }
  }

  /**
   * Get ecommerce connections (integrations) for a brand.
   */
  async getConnections(brandId: string): Promise<ConnectionInfo[]> {
    const list = await this.prisma.ecommerceIntegration.findMany({
      where: { brandId },
      select: {
        id: true,
        brandId: true,
        platform: true,
        shopDomain: true,
        status: true,
        lastSyncAt: true,
      },
    });
    return list.map((r) => ({
      id: r.id,
      brandId: r.brandId,
      platform: r.platform,
      shopDomain: r.shopDomain,
      status: r.status,
      lastSyncAt: r.lastSyncAt,
    }));
  }

  /**
   * Trigger a sync job (products, orders, inventory, or full).
   * Emits PCE sync events; actual work is done by the sync processor which calls syncProducts/syncOrders or SyncEngineService.
   */
  async triggerSync(params: SyncTriggerParams): Promise<{ queued: boolean; jobId?: string }> {
    this.eventEmitter.emit(PCE_EVENTS.SYNC_STARTED, {
      connectionId: params.connectionId,
      type: params.type,
    });
    this.logger.log(`Trigger sync: ${params.type} for connection ${params.connectionId}`);
    return { queued: true };
  }
}
