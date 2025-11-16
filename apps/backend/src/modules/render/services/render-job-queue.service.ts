import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { JobsOptions, Queue } from 'bullmq';
import { QueueNames } from '@/jobs/queue.constants';
import { JobNames } from '@/jobs/job.constants';
import { BaseQueueService } from '@/jobs/services/base-queue.service';
import {
  RenderJobData,
  BatchRenderJobPayload,
  RenderQueuePayload,
} from '../interfaces/render-job.interface';

type RenderJobName = typeof JobNames.RENDER[keyof typeof JobNames.RENDER];

@Injectable()
export class RenderJobQueueService extends BaseQueueService<RenderQueuePayload> {
  constructor(
    @InjectQueue(QueueNames.RENDER_PROCESSING)
    queue: Queue<RenderQueuePayload, any, string>,
  ) {
    super(RenderJobQueueService.name, queue);
  }

  async enqueueRenderJob(
    jobName: RenderJobName,
    payload: RenderJobData,
    options?: JobsOptions,
  ) {
    return this.enqueue(jobName, payload, options);
  }

  async enqueueBatch(job: BatchRenderJobPayload, options?: JobsOptions) {
    return this.enqueue(JobNames.RENDER.BATCH_RENDER, job, options);
  }
}

