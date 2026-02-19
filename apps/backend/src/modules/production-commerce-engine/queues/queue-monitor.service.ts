import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PCE_QUEUES } from '../pce.constants';

const QUEUE_NAMES = [
  PCE_QUEUES.PIPELINE,
  PCE_QUEUES.FULFILLMENT,
  PCE_QUEUES.RENDER,
  PCE_QUEUES.SYNC,
  PCE_QUEUES.PRODUCTION,
  PCE_QUEUES.WEBHOOKS,
  PCE_QUEUES.NOTIFICATIONS,
] as const;

export interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface DashboardData {
  queues: QueueMetrics[];
  alerts: Array<{ queueName: string; message: string; severity: 'warning' | 'error' }>;
  timestamp: Date;
}

@Injectable()
export class QueueMonitorService {
  private readonly logger = new Logger(QueueMonitorService.name);

  constructor(
    @InjectQueue(PCE_QUEUES.PIPELINE) private pipelineQueue: Queue,
    @InjectQueue(PCE_QUEUES.FULFILLMENT) private fulfillmentQueue: Queue,
    @InjectQueue(PCE_QUEUES.RENDER) private renderQueue: Queue,
    @InjectQueue(PCE_QUEUES.SYNC) private syncQueue: Queue,
    @InjectQueue(PCE_QUEUES.PRODUCTION) private productionQueue: Queue,
    @InjectQueue(PCE_QUEUES.WEBHOOKS) private webhooksQueue: Queue,
    @InjectQueue(PCE_QUEUES.NOTIFICATIONS) private notificationsQueue: Queue,
  ) {}

  @Cron('*/5 * * * *')
  async scheduledThresholdCheck(): Promise<void> {
    const alerts = await this.checkAlerts();
    for (const a of alerts) {
      this.logger.warn(`[PCE Queue Alert] ${a.queueName}: ${a.message}`);
    }
  }

  async getQueueMetrics(queueName: string): Promise<QueueMetrics | null> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return null;
    try {
      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
      const isPaused = await queue.isPaused();
      return {
        name: queueName,
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
        paused: isPaused,
      };
    } catch {
      return null;
    }
  }

  async getDashboardData(): Promise<DashboardData> {
    const queues: QueueMetrics[] = [];
    const alerts: DashboardData['alerts'] = [];

    for (const name of QUEUE_NAMES) {
      const metrics = await this.getQueueMetrics(name);
      if (metrics) {
        queues.push(metrics);
        if (metrics.failed > 100) {
          alerts.push({ queueName: name, message: `High failed count: ${metrics.failed}`, severity: 'error' });
        }
        if (metrics.waiting > 1000) {
          alerts.push({ queueName: name, message: `High waiting count: ${metrics.waiting}`, severity: 'warning' });
        }
      }
    }

    return {
      queues,
      alerts,
      timestamp: new Date(),
    };
  }

  async checkAlerts(): Promise<DashboardData['alerts']> {
    const data = await this.getDashboardData();
    return data.alerts;
  }

  private getQueueByName(name: string): Queue | null {
    const map: Record<string, Queue> = {
      [PCE_QUEUES.PIPELINE]: this.pipelineQueue,
      [PCE_QUEUES.FULFILLMENT]: this.fulfillmentQueue,
      [PCE_QUEUES.RENDER]: this.renderQueue,
      [PCE_QUEUES.SYNC]: this.syncQueue,
      [PCE_QUEUES.PRODUCTION]: this.productionQueue,
      [PCE_QUEUES.WEBHOOKS]: this.webhooksQueue,
      [PCE_QUEUES.NOTIFICATIONS]: this.notificationsQueue,
    };
    return map[name] ?? null;
  }
}
