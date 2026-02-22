import { Injectable, Logger } from '@nestjs/common';
import { PCE_QUEUES } from '../pce.constants';
import { InjectPCEQueue, PCEQueue } from './pce-queue.provider';
import type { QueueStatus } from '../interfaces/pce.interfaces';

@Injectable()
export class QueueManagerService {
  private readonly logger = new Logger(QueueManagerService.name);
  private readonly queues: Map<string, PCEQueue>;

  constructor(
    @InjectPCEQueue(PCE_QUEUES.PIPELINE) pipelineQueue: PCEQueue,
    @InjectPCEQueue(PCE_QUEUES.FULFILLMENT) fulfillmentQueue: PCEQueue,
    @InjectPCEQueue(PCE_QUEUES.RENDER) renderQueue: PCEQueue,
    @InjectPCEQueue(PCE_QUEUES.SYNC) syncQueue: PCEQueue,
    @InjectPCEQueue(PCE_QUEUES.PRODUCTION) productionQueue: PCEQueue,
    @InjectPCEQueue(PCE_QUEUES.WEBHOOKS) webhooksQueue: PCEQueue,
    @InjectPCEQueue(PCE_QUEUES.NOTIFICATIONS) notificationsQueue: PCEQueue,
  ) {
    this.queues = new Map([
      [PCE_QUEUES.PIPELINE, pipelineQueue],
      [PCE_QUEUES.FULFILLMENT, fulfillmentQueue],
      [PCE_QUEUES.RENDER, renderQueue],
      [PCE_QUEUES.SYNC, syncQueue],
      [PCE_QUEUES.PRODUCTION, productionQueue],
      [PCE_QUEUES.WEBHOOKS, webhooksQueue],
      [PCE_QUEUES.NOTIFICATIONS, notificationsQueue],
    ]);
  }

  async getAllQueuesStatus(): Promise<Record<string, QueueStatus>> {
    const result: Record<string, QueueStatus> = {};

    for (const [name, queue] of this.queues) {
      result[name] = await this.getQueueStatus(queue, name);
    }

    return result;
  }

  async getQueueCounts(queueName: string): Promise<QueueStatus> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }
    return this.getQueueStatus(queue, queueName);
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue not found: ${queueName}`);
    await queue.pause();
    this.logger.log(`Queue paused: ${queueName}`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue not found: ${queueName}`);
    await queue.resume();
    this.logger.log(`Queue resumed: ${queueName}`);
  }

  async retryFailedJobs(queueName: string, limit = 100): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue not found: ${queueName}`);

    const failed = await queue.getFailed(0, limit);
    let retried = 0;

    for (const job of failed as Array<{ retry: () => Promise<void>; id?: string }>) {
      try {
        await (job as { retry: () => Promise<void> }).retry();
        retried++;
      } catch {
        this.logger.warn(`Failed to retry job ${(job as { id?: string }).id} in ${queueName}`);
      }
    }

    this.logger.log(`Retried ${retried}/${failed.length} jobs in ${queueName}`);
    return retried;
  }

  /**
   * Clean stale completed and failed jobs older than graceMs.
   */
  async cleanStaleJobs(graceMs: number = 86400_000, limitPerType: number = 1000): Promise<Record<string, { completed: number; failed: number }>> {
    const result: Record<string, { completed: number; failed: number }> = {};
    for (const [name, queue] of this.queues) {
      try {
        const completed = await queue.clean(graceMs, limitPerType, 'completed');
        const failed = await queue.clean(graceMs, limitPerType, 'failed');
        result[name] = { completed: completed.length, failed: failed.length };
      } catch (err) {
        this.logger.warn(`Clean stale failed for ${name}: ${err instanceof Error ? err.message : String(err)}`);
        result[name] = { completed: 0, failed: 0 };
      }
    }
    return result;
  }

  private async getQueueStatus(queue: PCEQueue, name: string): Promise<QueueStatus> {
    const counts = await queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );
    const isPaused = await queue.isPaused();

    return {
      name,
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: isPaused,
    };
  }
}
