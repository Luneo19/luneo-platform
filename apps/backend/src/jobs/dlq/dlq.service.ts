import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

@Injectable()
export class DLQService {
  private readonly logger = new Logger(DLQService.name);

  constructor(
    @InjectQueue('ai-generation') private readonly aiQueue: Queue,
    @InjectQueue('design-generation') private readonly designQueue: Queue,
    @InjectQueue('render-processing') private readonly renderQueue: Queue,
    @InjectQueue('production-processing') private readonly productionQueue: Queue,
  ) {}

  /**
   * Récupère toutes les queues
   */
  private getQueues(): Map<string, Queue> {
    return new Map([
      ['ai-generation', this.aiQueue],
      ['design-generation', this.designQueue],
      ['render-processing', this.renderQueue],
      ['production-processing', this.productionQueue],
    ]);
  }

  /**
   * Récupère les jobs échoués d'une queue
   */
  async getFailedJobs(queueName: string, limit: number = 50): Promise<Job[]> {
    const queue = this.getQueues().get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const failed = await queue.getFailed(0, limit - 1);
    return failed;
  }

  /**
   * Récupère les stats des jobs échoués
   */
  async getFailedStats(): Promise<Record<string, { count: number; oldest: Date | null }>> {
    const stats: Record<string, { count: number; oldest: Date | null }> = {};

    for (const [queueName, queue] of this.getQueues()) {
      const failed = await queue.getFailed(0, 99);
      const oldest = failed.length > 0 ? new Date((failed[failed.length - 1] as any).timestamp || Date.now()) : null;

      stats[queueName] = {
        count: failed.length,
        oldest,
      };
    }

    return stats;
  }

  /**
   * Réessaye un job échoué
   */
  async retryJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueues().get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    if (!job.failedReason) {
      throw new Error(`Job ${jobId} is not failed`);
    }

    await job.retry();
    this.logger.log(`Retrying job ${jobId} from queue ${queueName}`);
  }

  /**
   * Supprime un job échoué
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueues().get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    await job.remove();
    this.logger.log(`Removed job ${jobId} from queue ${queueName}`);
  }

  /**
   * Nettoie les anciens jobs échoués
   */
  async cleanupOldFailedJobs(queueName: string, olderThanDays: number = 30): Promise<number> {
    const queue = this.getQueues().get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const failed = await queue.getFailed(0, 999);
    let removed = 0;

    for (const job of failed) {
      if ((job as any).timestamp && new Date((job as any).timestamp) < cutoffDate) {
        await job.remove();
        removed++;
      }
    }

    this.logger.log(`Cleaned up ${removed} old failed jobs from queue ${queueName}`);
    return removed;
  }
}
































