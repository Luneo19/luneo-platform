import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue, JobsOptions } from 'bullmq';
import { QueueNames } from '@/jobs/queue.constants';
import { JobNames } from '@/jobs/job.constants';
import { BaseQueueService } from '@/jobs/services/base-queue.service';
import type { UsageMetric } from '../interfaces/usage.interface';

export interface UsageMeteringJobPayload {
  usageMetric: UsageMetric;
}

@Injectable()
export class UsageQueueService extends BaseQueueService<UsageMeteringJobPayload> {
  constructor(
    @InjectQueue(QueueNames.USAGE_METERING)
    usageQueue: Queue<UsageMeteringJobPayload, any, string>,
  ) {
    super(UsageQueueService.name, usageQueue);
  }

  async enqueueUsageMetric(payload: UsageMeteringJobPayload, options?: JobsOptions): Promise<string> {
    const job = await this.enqueue(JobNames.USAGE_METERING.RECORD_USAGE, payload, options);
    return job.id?.toString() ?? payload.usageMetric.id;
  }
}

