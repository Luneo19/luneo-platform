import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PCE_QUEUES } from '../pce.constants';
import type { QueueStatus } from '../interfaces/pce.interfaces';

@Injectable()
export class QueueManagerService {
  private readonly logger = new Logger(QueueManagerService.name);
  private readonly queues: Map<string, Queue>;

  constructor(
    @InjectQueue(PCE_QUEUES.PIPELINE) pipelineQueue: Queue,
    @InjectQueue(PCE_QUEUES.FULFILLMENT) fulfillmentQueue: Queue,
    @InjectQueue(PCE_QUEUES.RENDER) renderQueue: Queue,
    @InjectQueue(PCE_QUEUES.SYNC) syncQueue: Queue,
    @InjectQueue(PCE_QUEUES.PRODUCTION) productionQueue: Queue,
    @InjectQueue(PCE_QUEUES.WEBHOOKS) webhooksQueue: Queue,
    @InjectQueue(PCE_QUEUES.NOTIFICATIONS) notificationsQueue: Queue,
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

    for (const job of failed) {
      try {
        await job.retry();
        retried++;
      } catch {
        this.logger.warn(`Failed to retry job ${job.id} in ${queueName}`);
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

  private async getQueueStatus(queue: Queue, name: string): Promise<QueueStatus> {
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
