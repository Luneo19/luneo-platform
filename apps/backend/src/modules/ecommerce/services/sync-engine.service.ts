/**
 * @fileoverview Sync Engine centralisé pour e-commerce
 * @module SyncEngineService
 *
 * Conforme au plan PHASE 4 - Intégrations e-commerce - Centraliser les jobs dans BullMQ
 *
 * FONCTIONNALITÉS:
 * - Centralise tous les jobs de sync (produits, commandes) dans BullMQ
 * - Gère les jobs récurrents (scheduled syncs)
 * - Retry automatique en cas d'échec
 * - Monitoring et logging
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Gestion d'erreurs
 * - ✅ Logging structuré
 */

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ProductSyncService } from './product-sync.service';
import { OrderSyncService } from './order-sync.service';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Type de job de sync
 */
export type SyncJobType = 'product' | 'order' | 'inventory' | 'full';

/**
 * Direction de sync
 */
export type SyncDirection = 'import' | 'export' | 'bidirectional';

/**
 * Options de job de sync
 */
export interface SyncJobOptions {
  integrationId: string;
  type: SyncJobType;
  direction?: SyncDirection;
  productIds?: string[];
  orderIds?: string[];
  force?: boolean;
  priority?: number;
  delay?: number; // ms
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

/**
 * Résultat d'un job de sync
 */
export interface SyncJobResult {
  jobId: string;
  status: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed';
  itemsProcessed?: number;
  itemsFailed?: number;
  errors?: Array<{ message: string; itemId?: string }>;
  duration?: number;
}

/**
 * Statut d'un job
 */
export interface JobStatus {
  id: string;
  type: SyncJobType;
  status: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed';
  progress?: number;
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class SyncEngineService {
  private readonly logger = new Logger(SyncEngineService.name);

  constructor(
    @InjectQueue('ecommerce-sync') private readonly syncQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly productSyncService: ProductSyncService,
    private readonly orderSyncService: OrderSyncService,
  ) {}

  // ==========================================================================
  // JOB MANAGEMENT
  // ==========================================================================

  /**
   * Ajoute un job de sync dans la queue BullMQ
   * Conforme au plan PHASE 4 - Centraliser les jobs dans BullMQ
   */
  async queueSyncJob(options: SyncJobOptions): Promise<string> {
    // ✅ Validation des entrées
    if (!options.integrationId || typeof options.integrationId !== 'string' || options.integrationId.trim().length === 0) {
      throw new BadRequestException('Integration ID is required');
    }

    if (!options.type || !['product', 'order', 'inventory', 'full'].includes(options.type)) {
      throw new BadRequestException('Invalid sync job type');
    }

    // ✅ Vérifier que l'intégration existe
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: options.integrationId.trim() },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${options.integrationId} not found`);
    }

    if (integration.status !== 'active') {
      throw new BadRequestException(`Integration ${options.integrationId} is not active`);
    }

    try {
      // ✅ Construire les données du job
      const jobData = {
        integrationId: options.integrationId.trim(),
        type: options.type,
        direction: options.direction || 'bidirectional',
        productIds: options.productIds || [],
        orderIds: options.orderIds || [],
      };

      // ✅ Déterminer le nom du job selon le type
      const jobName = options.type === 'full' ? 'sync-full' : `sync-${options.type}`;

      // ✅ Options du job BullMQ
      const jobOptions = {
        priority: options.priority || 0,
        delay: options.delay || 0,
        attempts: options.attempts || 3,
        backoff: options.backoff || {
          type: 'exponential' as const,
          delay: 2000, // 2s, 4s, 8s...
        },
        removeOnComplete: {
          age: 24 * 3600, // Garder 24h
          count: 1000, // Max 1000 jobs complétés
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Garder 7 jours pour les échecs
        },
      };

      // ✅ Ajouter le job à la queue
      const job = await this.syncQueue.add(
        jobName,
        jobData,
        jobOptions,
      );

      this.logger.log(
        `Sync job queued: ${job.id} (type: ${options.type}, integration: ${options.integrationId})`,
      );

      return job.id!;
    } catch (error) {
      this.logger.error(
        `Failed to queue sync job: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Programme un job de sync récurrent
   * Conforme au plan PHASE 4 - Centraliser les jobs dans BullMQ
   */
  async scheduleRecurringSync(
    integrationId: string,
    type: SyncJobType,
    interval: 'hourly' | 'daily' | 'weekly',
    options?: Omit<SyncJobOptions, 'integrationId' | 'type'>,
  ): Promise<string> {
    // ✅ Validation
    if (!integrationId || typeof integrationId !== 'string' || integrationId.trim().length === 0) {
      throw new BadRequestException('Integration ID is required');
    }

    // ✅ Expression cron selon l'intervalle
    const cronExpression = this.getCronExpression(interval);

    try {
      const jobData = {
        integrationId: integrationId.trim(),
        type,
        direction: options?.direction || 'bidirectional',
        productIds: options?.productIds || [],
        orderIds: options?.orderIds || [],
      };

      // ✅ Déterminer le nom du job
      const jobName = type === 'full' ? 'sync-full' : `sync-${type}`;

      // ✅ Job récurrent avec pattern cron
      const job = await this.syncQueue.add(
        jobName,
        jobData,
        {
          repeat: {
            pattern: cronExpression,
          },
          priority: options?.priority || 0,
          attempts: options?.attempts || 3,
          backoff: options?.backoff || {
            type: 'exponential' as const,
            delay: 2000,
          },
        },
      );

      this.logger.log(
        `Recurring sync scheduled: ${job.id} (type: ${type}, interval: ${interval}, integration: ${integrationId})`,
      );

      return job.id!;
    } catch (error) {
      this.logger.error(
        `Failed to schedule recurring sync: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient le statut d'un job
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      const job = await this.syncQueue.getJob(jobId);

      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress;

      const data = job.data as Record<string, unknown>;
      return {
        id: job.id!,
        type: ((data.type as string) || 'product') as SyncJobType,
        status: state as JobStatus['status'],
        progress: typeof progress === 'number' ? progress : undefined,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        failedAt: job.failedReason ? new Date(job.timestamp) : undefined,
        error: job.failedReason || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get job status: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Annule un job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      const job = await this.syncQueue.getJob(jobId);

      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found`);
      }

      await job.remove();
      this.logger.log(`Job ${jobId} cancelled`);
    } catch (error) {
      this.logger.error(
        `Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Réessaie un job échoué
   */
  async retryJob(jobId: string): Promise<string> {
    try {
      const job = await this.syncQueue.getJob(jobId);

      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found`);
      }

      const state = await job.getState();

      if (state !== 'failed') {
        throw new BadRequestException(`Job ${jobId} is not in failed state`);
      }

      // ✅ Créer un nouveau job avec les mêmes données
      const newJob = await this.syncQueue.add(
        job.name!,
        job.data,
        {
          priority: job.opts.priority || 0,
          attempts: job.opts.attempts || 3,
        },
      );

      this.logger.log(`Job ${jobId} retried as ${newJob.id}`);

      return newJob.id!;
    } catch (error) {
      this.logger.error(
        `Failed to retry job: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient les jobs d'une intégration
   */
  async getIntegrationJobs(
    integrationId: string,
    limit: number = 50,
  ): Promise<JobStatus[]> {
    try {
      const jobs = await this.syncQueue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed'], 0, limit);

      // ✅ Filtrer par integrationId
      const integrationJobs = jobs.filter(
        (job) => (job.data as Record<string, unknown>).integrationId === integrationId,
      );

      // ✅ Mapper en JobStatus
      return (await Promise.all(
        integrationJobs.map(async (job) => {
          const state = await job.getState();
          const progress = job.progress;

          const jobData = job.data as Record<string, unknown>;
          return {
            id: job.id!,
            type: ((jobData.type as string) || 'product') as SyncJobType,
            status: state as JobStatus['status'],
            progress: typeof progress === 'number' ? progress : undefined,
            createdAt: new Date(job.timestamp),
            processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
            failedAt: job.failedReason ? new Date(job.timestamp) : undefined,
            error: job.failedReason || undefined,
          };
        }),
      )) as unknown as JobStatus[];
    } catch (error) {
      this.logger.error(
        `Failed to get integration jobs: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return [];
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Obtient l'expression cron selon l'intervalle
   */
  private getCronExpression(interval: 'hourly' | 'daily' | 'weekly'): string {
    switch (interval) {
      case 'hourly':
        return '0 * * * *'; // Toutes les heures
      case 'daily':
        return '0 2 * * *'; // Tous les jours à 2h du matin
      case 'weekly':
        return '0 2 * * 1'; // Tous les lundis à 2h du matin
      default:
        throw new BadRequestException(`Invalid interval: ${interval}`);
    }
  }
}
