import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { JobsOptions, Queue } from 'bullmq';
import { QueueNames } from '@/jobs/queue.constants';
import { JobNames } from '@/jobs/job.constants';
import { BaseQueueService } from '@/jobs/services/base-queue.service';
import {
  ProductionJobData,
  ProductionJobPayload,
  ProductionTrackingPayload,
} from '../interfaces/production-jobs.interface';

type ProductionJobName =
  | (typeof JobNames.PRODUCTION)[keyof typeof JobNames.PRODUCTION]
  | 'track-production';

@Injectable()
export class ProductionJobQueueService extends BaseQueueService<ProductionJobPayload> {
  constructor(
    @InjectQueue(QueueNames.PRODUCTION_PROCESSING)
    queue: Queue<ProductionJobPayload, any, string>,
  ) {
    super(ProductionJobQueueService.name, queue);
  }

  async enqueueJob(
    jobName: ProductionJobName,
    payload: ProductionJobPayload,
    options?: JobsOptions,
  ) {
    return this.enqueue(jobName, payload, options);
  }

  async enqueueCreateBundle(payload: ProductionJobData, options?: JobsOptions) {
    return this.enqueue(JobNames.PRODUCTION.CREATE_BUNDLE, payload, options);
  }

  async enqueueQualityControl(payload: ProductionJobData, options?: JobsOptions) {
    return this.enqueue(JobNames.PRODUCTION.QUALITY_CONTROL, payload, options);
  }

  async enqueueTracking(payload: ProductionTrackingPayload, options?: JobsOptions) {
    return this.enqueue(JobNames.PRODUCTION.TRACK_PRODUCTION, payload, options);
  }

  async enqueueInstructions(payload: ProductionJobData, options?: JobsOptions) {
    return this.enqueue(JobNames.PRODUCTION.GENERATE_INSTRUCTIONS, payload, options);
  }
}

