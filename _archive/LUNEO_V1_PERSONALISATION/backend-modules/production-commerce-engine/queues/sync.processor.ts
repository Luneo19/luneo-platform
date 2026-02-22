import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SyncLogType, SyncDirection, SyncLogStatus } from '@prisma/client';
import { PCE_QUEUES, PCE_EVENTS } from '../pce.constants';
import { EcommerceBridgeService } from '../bridges/ecommerce-bridge.service';

export type SyncJobType = 'sync-products' | 'sync-orders' | 'sync-inventory' | 'sync-full';

interface SyncJobPayload {
  connectionId: string;
  type: SyncJobType;
  options?: Record<string, unknown>;
}

@Processor(PCE_QUEUES.SYNC)
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly ecommerceBridge: EcommerceBridgeService,
  ) {
    super();
  }

  async process(job: Job<SyncJobPayload>): Promise<void> {
    const { name, data } = job;
    const connectionId = data.connectionId;
    this.logger.log(`Processing sync job: ${name} connection=${connectionId}`);

    try {
      let result: { success: boolean; itemsProcessed?: number; itemsFailed?: number; error?: string; durationMs?: number };
      const start = Date.now();

      switch (name as SyncJobType) {
        case 'sync-products':
          result = await this.ecommerceBridge.syncProducts(connectionId);
          await this.logSync(connectionId, SyncLogType.PRODUCT, result, start);
          break;
        case 'sync-orders':
          result = await this.ecommerceBridge.syncOrders(connectionId);
          await this.logSync(connectionId, SyncLogType.ORDER, result, start);
          break;
        case 'sync-inventory':
          result = await this.ecommerceBridge.syncProducts(connectionId);
          await this.logSync(connectionId, SyncLogType.INVENTORY, result, start);
          break;
        case 'sync-full':
          const productsResult = await this.ecommerceBridge.syncProducts(connectionId);
          const ordersResult = await this.ecommerceBridge.syncOrders(connectionId);
          result = {
            success: productsResult.success && ordersResult.success,
            itemsProcessed: (productsResult.itemsProcessed ?? 0) + (ordersResult.itemsProcessed ?? 0),
            itemsFailed: (productsResult.itemsFailed ?? 0) + (ordersResult.itemsFailed ?? 0),
            durationMs: Date.now() - start,
          };
          await this.logSync(connectionId, SyncLogType.PRODUCT, result, start);
          break;
        default:
          this.logger.warn(`Unknown sync job type: ${name}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Sync job failed: ${name} connection=${connectionId} - ${message}`);
      this.eventEmitter.emit(PCE_EVENTS.SYNC_FAILED, { connectionId, type: name, error: message });
      await this.logSync(connectionId, SyncLogType.PRODUCT, { success: false, error: message }, Date.now());
    }
  }

  private async logSync(
    integrationId: string,
    type: SyncLogType,
    result: { success: boolean; itemsProcessed?: number; itemsFailed?: number; error?: string; durationMs?: number },
    startTime: number,
  ): Promise<void> {
    const duration = result.durationMs ?? Date.now() - startTime;
    const status = result.success
      ? SyncLogStatus.SUCCESS
      : (result.itemsFailed ?? 0) > 0
        ? SyncLogStatus.PARTIAL
        : SyncLogStatus.FAILED;
    await this.prisma.syncLog.create({
      data: {
        integrationId,
        type,
        direction: SyncDirection.IMPORT,
        status,
        itemsProcessed: result.itemsProcessed ?? 0,
        itemsFailed: result.itemsFailed ?? (result.success ? 0 : 1),
        errors: result.error ? ([{ message: result.error }] as object) : undefined,
        duration,
      },
    });
  }
}
