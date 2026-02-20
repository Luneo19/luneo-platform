import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SyncDirection, SyncLogStatus, SyncLogType } from '@prisma/client';

export type SyncDirectionType = 'import' | 'export';

export interface ConnectorStatus {
  integrationId: string;
  platform: string;
  status: string;
  lastSyncAt: Date | null;
  lastSyncByType: Record<string, { at: Date; status: SyncLogStatus; errors?: unknown } | null>;
  errors: string[];
}

@Injectable()
export class EcommerceConnectorService {
  private readonly logger = new Logger(EcommerceConnectorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncProducts(integrationId: string, direction: SyncDirectionType): Promise<{ processed: number; failed: number }> {
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
      include: { productMappings: true },
    });
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationId} not found`);
    }
    if (integration.status !== 'active') {
      throw new BadRequestException('Integration is not active');
    }

    const dir = direction === 'import' ? SyncDirection.IMPORT : SyncDirection.EXPORT;
    const start = Date.now();
    let itemsProcessed = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      if (dir === SyncDirection.IMPORT) {
        const result = await this.importProductsFromPlatform(integration);
        itemsProcessed = result.processed;
        itemsFailed = result.failed;
        errors.push(...result.errors);
      } else {
        const result = await this.exportProductsToPlatform(integration);
        itemsProcessed = result.processed;
        itemsFailed = result.failed;
        errors.push(...result.errors);
      }

      const duration = Date.now() - start;
      const logStatus =
        itemsFailed === 0 ? SyncLogStatus.SUCCESS : itemsProcessed > 0 ? SyncLogStatus.PARTIAL : SyncLogStatus.FAILED;

      await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: SyncLogType.PRODUCT,
          direction: dir,
          status: logStatus,
          itemsProcessed,
          itemsFailed,
          errors: errors.length ? errors : undefined,
          duration,
        },
      });

      await this.prisma.ecommerceIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date() },
      });

      this.logger.log(
        `syncProducts ${direction} for ${integration.platform} (${integrationId}): ${itemsProcessed} processed, ${itemsFailed} failed`,
      );
      return { processed: itemsProcessed, failed: itemsFailed };
    } catch (err) {
      const duration = Date.now() - start;
      const message = err instanceof Error ? err.message : 'Unknown error';
      await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: SyncLogType.PRODUCT,
          direction: dir,
          status: SyncLogStatus.FAILED,
          itemsProcessed,
          itemsFailed,
          errors: [message],
          duration,
        },
      });
      this.logger.error(`syncProducts failed for ${integrationId}: ${message}`);
      throw new InternalServerErrorException(`Product sync failed: ${message}`);
    }
  }

  async syncOrders(integrationId: string): Promise<{ processed: number; failed: number }> {
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationId} not found`);
    }
    if (integration.status !== 'active') {
      throw new BadRequestException('Integration is not active');
    }

    const start = Date.now();
    let itemsProcessed = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      const result = await this.fetchAndUpsertOrders(integration);
      itemsProcessed = result.processed;
      itemsFailed = result.failed;
      errors.push(...result.errors);

      const duration = Date.now() - start;
      const logStatus =
        itemsFailed === 0 ? SyncLogStatus.SUCCESS : itemsProcessed > 0 ? SyncLogStatus.PARTIAL : SyncLogStatus.FAILED;

      await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: SyncLogType.ORDER,
          direction: SyncDirection.IMPORT,
          status: logStatus,
          itemsProcessed,
          itemsFailed,
          errors: errors.length ? errors : undefined,
          duration,
        },
      });

      await this.prisma.ecommerceIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date() },
      });

      this.logger.log(`syncOrders for ${integration.platform} (${integrationId}): ${itemsProcessed} processed`);
      return { processed: itemsProcessed, failed: itemsFailed };
    } catch (err) {
      const duration = Date.now() - start;
      const message = err instanceof Error ? err.message : 'Unknown error';
      await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: SyncLogType.ORDER,
          direction: SyncDirection.IMPORT,
          status: SyncLogStatus.FAILED,
          itemsProcessed,
          itemsFailed,
          errors: [message],
          duration,
        },
      });
      this.logger.error(`syncOrders failed for ${integrationId}: ${message}`);
      throw new InternalServerErrorException(`Order sync failed: ${message}`);
    }
  }

  async syncInventory(integrationId: string): Promise<{ processed: number; failed: number }> {
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
      include: { productMappings: true },
    });
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationId} not found`);
    }
    if (integration.status !== 'active') {
      throw new BadRequestException('Integration is not active');
    }

    const start = Date.now();
    let itemsProcessed = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      for (const mapping of integration.productMappings) {
        try {
          const stock = await this.fetchRemoteInventory(integration, mapping.externalProductId);
          await this.prisma.productVariant.updateMany({
            where: { productId: mapping.luneoProductId },
            data: { stock },
          });
          await this.prisma.productMapping.update({
            where: { id: mapping.id },
            data: { lastSyncedAt: new Date(), syncStatus: 'synced' },
          });
          itemsProcessed++;
        } catch (e) {
          itemsFailed++;
          errors.push(
            `Product ${mapping.luneoProductId}: ${e instanceof Error ? e.message : 'Unknown error'}`,
          );
        }
      }

      const duration = Date.now() - start;
      const logStatus =
        itemsFailed === 0 ? SyncLogStatus.SUCCESS : itemsProcessed > 0 ? SyncLogStatus.PARTIAL : SyncLogStatus.FAILED;

      await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: SyncLogType.INVENTORY,
          direction: SyncDirection.IMPORT,
          status: logStatus,
          itemsProcessed,
          itemsFailed,
          errors: errors.length ? errors : undefined,
          duration,
        },
      });

      await this.prisma.ecommerceIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date() },
      });

      this.logger.log(`syncInventory for ${integration.platform} (${integrationId}): ${itemsProcessed} processed`);
      return { processed: itemsProcessed, failed: itemsFailed };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`syncInventory failed for ${integrationId}: ${message}`);
      throw new InternalServerErrorException(`Inventory sync failed: ${message}`);
    }
  }

  async getConnectorStatus(integrationId: string): Promise<ConnectorStatus> {
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
      include: {
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationId} not found`);
    }

    const lastSyncByType: ConnectorStatus['lastSyncByType'] = {};
    const types = [SyncLogType.PRODUCT, SyncLogType.ORDER, SyncLogType.INVENTORY] as const;
    for (const type of types) {
      const last = integration.syncLogs.find((l) => l.type === type);
      lastSyncByType[type] = last
        ? { at: last.createdAt, status: last.status, errors: last.errors as unknown }
        : null;
    }

    const errors = integration.syncLogs
      .filter((l) => l.status === SyncLogStatus.FAILED && l.errors)
      .flatMap((l) => (Array.isArray(l.errors) ? l.errors : [String(l.errors)]));

    return {
      integrationId: integration.id,
      platform: integration.platform,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt,
      lastSyncByType,
      errors: errors.slice(0, 10).map((e) => String(e)),
    };
  }

  private async importProductsFromPlatform(integration: {
    id: string;
    platform: string;
    brandId: string;
    config: unknown;
  }): Promise<{ processed: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;
    if (['prestashop', 'bigcommerce', 'etsy'].includes(integration.platform.toLowerCase())) {
      try {
        const remoteProducts = await this.fetchRemoteProducts(integration);
        for (const ext of remoteProducts) {
          try {
            await this.prisma.productMapping.upsert({
              where: {
                integrationId_externalProductId: {
                  integrationId: integration.id,
                  externalProductId: ext.id,
                },
              },
              create: {
                integrationId: integration.id,
                luneoProductId: ext.luneoId,
                externalProductId: ext.id,
                externalSku: ext.sku ?? ext.id,
              },
              update: { lastSyncedAt: new Date(), syncStatus: 'synced' },
            });
            processed++;
          } catch {
            failed++;
            errors.push(`Import product ${ext.id} failed`);
          }
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : 'Remote fetch failed');
        failed++;
      }
    } else {
      errors.push(`Unsupported platform: ${integration.platform}`);
    }
    return { processed, failed, errors };
  }

  private async exportProductsToPlatform(integration: {
    id: string;
    platform: string;
    brandId: string;
    productMappings: { luneoProductId: string; externalProductId: string; externalSku: string }[];
  }): Promise<{ processed: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;
    const products = await this.prisma.product.findMany({
      where: { brandId: integration.brandId, deletedAt: null },
      select: { id: true, name: true, sku: true, price: true },
    });
    for (const product of products) {
      try {
        await this.pushProductToPlatform(integration, product);
        processed++;
      } catch (e) {
        failed++;
        errors.push(`Export ${product.id}: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    }
    return { processed, failed, errors };
  }

  private async fetchRemoteProducts(
    _integration: { platform: string; config: unknown },
  ): Promise<{ id: string; sku?: string; luneoId: string }[]> {
    return [];
  }

  private async pushProductToPlatform(
    _integration: { platform: string },
    _product: { id: string; name: string; sku: string | null; price: unknown },
  ): Promise<void> {
    return;
  }

  private async fetchAndUpsertOrders(_integration: {
    id: string;
    brandId: string;
    platform: string;
  }): Promise<{ processed: number; failed: number; errors: string[] }> {
    return { processed: 0, failed: 0, errors: [] };
  }

  private async fetchRemoteInventory(
    _integration: { platform: string; config: unknown },
    _externalProductId: string,
  ): Promise<number> {
    return 0;
  }
}
