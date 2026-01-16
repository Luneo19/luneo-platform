/**
 * @fileoverview Worker BullMQ pour les jobs de sync e-commerce
 * @module SyncWorker
 *
 * Conforme au plan PHASE 4 - Intégrations e-commerce - Centraliser les jobs dans BullMQ
 *
 * FONCTIONNALITÉS:
 * - Traite les jobs de sync produits
 * - Traite les jobs de sync commandes
 * - Gère les retries automatiques
 * - Logging structuré
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs robuste
 * - ✅ Logging structuré
 */

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProductSyncService } from '../services/product-sync.service';
import { OrderSyncService } from '../services/order-sync.service';

// ============================================================================
// TYPES
// ============================================================================

interface SyncJobData {
  integrationId: string;
  type: 'product' | 'order' | 'inventory' | 'full';
  direction?: 'import' | 'export' | 'bidirectional';
  productIds?: string[];
  orderIds?: string[];
  force?: boolean;
}

// ============================================================================
// WORKER
// ============================================================================

@Processor('ecommerce-sync')
export class SyncWorker {
  private readonly logger = new Logger(SyncWorker.name);

  constructor(
    private readonly productSyncService: ProductSyncService,
    private readonly orderSyncService: OrderSyncService,
  ) {}

  /**
   * Traite un job de sync produits
   */
  @Process('sync-product')
  async processProductSync(job: Job<SyncJobData>): Promise<unknown> {
    const { integrationId, direction, productIds } = job.data;

    this.logger.log(
      `Processing product sync job ${job.id}: integration=${integrationId}`,
    );

    try {
      await job.updateProgress(10);

      const result = await this.productSyncService.syncProducts({
        integrationId,
        productIds,
        options: {
          direction: direction || 'bidirectional',
          includeImages: true,
          includeInventory: true,
          includeOrders: false,
        },
      });

      await job.updateProgress(100);
      this.logger.log(`Product sync job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Product sync job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error; // BullMQ gère le retry automatiquement
    }
  }

  /**
   * Traite un job de sync commandes
   */
  @Process('sync-order')
  async processOrderSync(job: Job<SyncJobData>): Promise<unknown> {
    const { integrationId, direction, orderIds } = job.data;

    this.logger.log(
      `Processing order sync job ${job.id}: integration=${integrationId}`,
    );

    try {
      await job.updateProgress(10);

      const result = await this.orderSyncService.syncOrders({
        integrationId,
        orderIds,
        options: {
          direction: direction || 'import',
          includeImages: false,
          includeInventory: false,
          includeOrders: true,
        },
      });

      await job.updateProgress(100);
      this.logger.log(`Order sync job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Order sync job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Traite un job de sync complète
   */
  @Process('sync-full')
  async processFullSync(job: Job<SyncJobData>): Promise<unknown> {
    const { integrationId, direction } = job.data;

    this.logger.log(
      `Processing full sync job ${job.id}: integration=${integrationId}`,
    );

    try {
      await job.updateProgress(10);

      // ✅ Sync produits
      await job.updateProgress(30);
      const productResult = await this.productSyncService.syncProducts({
        integrationId,
        options: {
          direction: direction || 'bidirectional',
          includeImages: true,
          includeInventory: true,
          includeOrders: false,
        },
      });

      // ✅ Sync commandes
      await job.updateProgress(70);
      const orderResult = await this.orderSyncService.syncOrders({
        integrationId,
        options: {
          direction: direction || 'import',
          includeImages: false,
          includeInventory: false,
          includeOrders: true,
        },
      });

      await job.updateProgress(100);
      const result = {
        products: productResult,
        orders: orderResult,
      };

      this.logger.log(`Full sync job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Full sync job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
