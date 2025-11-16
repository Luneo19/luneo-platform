import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { JobsOptions, Queue } from 'bullmq';
import { QueueNames } from '@/jobs/queue.constants';
import { JobNames } from '@/jobs/job.constants';
import { BaseQueueService } from '@/jobs/services/base-queue.service';
import { EcommerceSyncJobPayload } from '../interfaces/ecommerce.interface';

@Injectable()
export class EcommerceSyncQueueService extends BaseQueueService<EcommerceSyncJobPayload> {
  constructor(
    @InjectQueue(QueueNames.ECOMMERCE_SYNC)
    syncQueue: Queue<EcommerceSyncJobPayload, any, string>,
  ) {
    super(EcommerceSyncQueueService.name, syncQueue);
  }

  async enqueueProductsSync(
    integrationId: string,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.enqueue(
      JobNames.ECOMMERCE.SYNC_PRODUCTS,
      { integrationId, scope: 'products' },
      options,
    );
    return job.id?.toString() ?? `${integrationId}:products-sync`;
  }

  async enqueueOrdersSync(
    integrationId: string,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.enqueue(
      JobNames.ECOMMERCE.SYNC_ORDERS,
      { integrationId, scope: 'orders' },
      options,
    );
    return job.id?.toString() ?? `${integrationId}:orders-sync`;
  }

  async scheduleProductsSync(
    integrationId: string,
    cronPattern: string,
  ): Promise<string> {
    const job = await this.queue.add(
      JobNames.ECOMMERCE_SYNC.SYNC_PRODUCTS,
      { integrationId, scope: 'products' },
      this.mergeOptions({
        jobId: `${integrationId}:products-sync-cron`,
        repeat: { pattern: cronPattern },
      }),
    );

    this.logger.debug(`Scheduled products sync`, {
      integrationId,
      jobId: job.id,
      pattern: cronPattern,
    });

    return job.id?.toString() ?? `${integrationId}:products-sync-cron`;
  }
}

