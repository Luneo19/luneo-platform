import { Logger } from '@nestjs/common';
import type { JobsOptions, Queue, Job } from 'bullmq';
import { context as otContext, propagation } from '@opentelemetry/api';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  removeOnComplete: 200,
  removeOnFail: 50,
  attempts: 2,
};

export abstract class BaseQueueService<TPayload> {
  protected readonly logger: Logger;

  protected constructor(
    loggerContext: string,
    protected readonly queue: Queue<any, any, string>,
    private readonly defaultOptions: JobsOptions = DEFAULT_JOB_OPTIONS,
  ) {
    this.logger = new Logger(loggerContext);
  }

  protected mergeOptions(options?: JobsOptions): JobsOptions {
    return {
      ...this.defaultOptions,
      ...(options ?? {}),
    };
  }

  protected async enqueue(
    jobName: string,
    payload: TPayload,
    options?: JobsOptions,
  ): Promise<Job<any, any, string>> {
    const merged = this.mergeOptions(options);
    const payloadWithTracing = this.attachTraceContext(payload);
    const job = await this.queue.add(jobName, payloadWithTracing, merged);
    this.logger.debug(`Job enqueued`, { jobName, jobId: job.id });
    return job;
  }

  private attachTraceContext(payload: TPayload): TPayload {
    if (!isRecord(payload)) {
      return payload;
    }

    const carrier: Record<string, string> = {};
    propagation.inject(otContext.active(), carrier);

    if (Object.keys(carrier).length === 0) {
      return payload;
    }

    return {
      ...(payload as Record<string, unknown>),
      __trace: carrier,
    } as TPayload;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

