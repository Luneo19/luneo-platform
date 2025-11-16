import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { JobsOptions, Queue } from 'bullmq';
import { QueueNames } from '@/jobs/queue.constants';
import { JobNames } from '@/jobs/job.constants';
import { BaseQueueService } from '@/jobs/services/base-queue.service';
import type {
  GenerateDesignJob,
  GenerateHighResJob,
} from '@/jobs/interfaces/ai-jobs.interface';

type AiJobPayload = GenerateDesignJob | GenerateHighResJob;

@Injectable()
export class AiQueueService extends BaseQueueService<AiJobPayload> {
  constructor(
    @InjectQueue(QueueNames.AI_GENERATION)
    aiQueue: Queue<AiJobPayload, any, string>,
  ) {
    super(AiQueueService.name, aiQueue);
  }

  async enqueueDesign(payload: GenerateDesignJob, options?: JobsOptions): Promise<string> {
    const job = await this.enqueue(JobNames.AI_GENERATION.GENERATE_DESIGN, payload, options);
    return job.id?.toString() ?? payload.designId;
  }

  async enqueueHighRes(payload: GenerateHighResJob, options?: JobsOptions): Promise<string> {
    const job = await this.enqueue(JobNames.AI_GENERATION.GENERATE_HIGH_RES, payload, options);
    return job.id?.toString() ?? `${payload.designId}:highres`;
  }
}

