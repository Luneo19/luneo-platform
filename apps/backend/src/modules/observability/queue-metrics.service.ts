import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { QueueHealthService } from '@/jobs/services/queue-health.service';
import {
  collectDefaultMetrics,
  Gauge,
  Registry,
} from 'prom-client';
import * as os from 'os';
import { CustomMetricsService } from './custom-metrics.service';

const REFRESH_INTERVAL_MS = 15_000;

export interface RealtimeQueueTotals {
  waiting: number;
  delayed: number;
  active: number;
  failed: number;
  completed: number;
}

export interface SystemHealthSnapshot {
  loadAvg1m: number;
  memoryRss: number;
  heapUsed: number;
  uptimeSeconds: number;
}

export interface RealtimeMetricsSnapshot {
  timestamp: string;
  queues: Awaited<ReturnType<QueueHealthService['getOverview']>>;
  totals: RealtimeQueueTotals;
  system: SystemHealthSnapshot;
}

@Injectable()
export class QueueMetricsService implements OnModuleInit {
  private readonly logger = new Logger(QueueMetricsService.name);
  private readonly registry = new Registry();
  private readonly jobCountsGauge: Gauge<string>;
  private readonly queueHealthGauge: Gauge<string>;
  private readonly queueOldestWaitingGauge: Gauge<string>;
  private readonly queueLastFailureGauge: Gauge<string>;
  private lastUpdated = 0;

  constructor(
    private readonly queueHealthService: QueueHealthService,
    private readonly customMetrics?: CustomMetricsService,
  ) {
    collectDefaultMetrics({ register: this.registry });

    this.jobCountsGauge = new Gauge({
      name: 'bullmq_queue_jobs_total',
      help: 'Number of jobs per state for a BullMQ queue',
      labelNames: ['queue', 'state'],
      registers: [this.registry],
    });

    this.queueHealthGauge = new Gauge({
      name: 'bullmq_queue_health_status',
      help: 'Queue health indicator (1 = healthy, 0 = unhealthy)',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.queueOldestWaitingGauge = new Gauge({
      name: 'bullmq_queue_oldest_waiting_seconds',
      help: 'Age in seconds of the oldest waiting job per queue',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.queueLastFailureGauge = new Gauge({
      name: 'bullmq_queue_last_failure_timestamp',
      help: 'Unix timestamp of the last failed job per queue',
      labelNames: ['queue'],
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    // Warm-up metrics on startup
    void this.refreshMetrics().catch((error) => {
      this.logger.error('Failed to initialize queue metrics', error);
    });
  }

  @Interval(REFRESH_INTERVAL_MS)
  async scheduledRefresh(): Promise<void> {
    await this.refreshMetrics();
  }

  async refreshMetrics(): Promise<void> {
    try {
      const overview = await this.queueHealthService.getOverview();

      this.jobCountsGauge.reset();
      this.queueHealthGauge.reset();
      this.queueOldestWaitingGauge.reset();
      this.queueLastFailureGauge.reset();

      const now = Date.now();

      overview.forEach((queue) => {
        this.queueHealthGauge.labels(queue.name).set(queue.isHealthy ? 1 : 0);

        Object.entries(queue.counts).forEach(([state, value]) => {
          this.jobCountsGauge.labels(queue.name, state).set(value ?? 0);
        });

        const oldestWaitingSeconds = queue.oldestWaitingAt
          ? Math.max(0, (now - new Date(queue.oldestWaitingAt).getTime()) / 1000)
          : 0;
        this.queueOldestWaitingGauge.labels(queue.name).set(oldestWaitingSeconds);
        
        // Record queue wait time metric for Prometheus alerts
        if (this.customMetrics && oldestWaitingSeconds > 0) {
          this.customMetrics.recordQueueWaitTime(queue.name, oldestWaitingSeconds);
        }

        const lastFailureTimestamp = queue.lastFailedAt
          ? new Date(queue.lastFailedAt).getTime() / 1000
          : 0;
        this.queueLastFailureGauge.labels(queue.name).set(lastFailureTimestamp);
      });

      this.lastUpdated = Date.now();
    } catch (error) {
      this.logger.error('Failed to refresh queue metrics', error);
    }
  }

  async getMetrics(): Promise<string> {
    const stale = Date.now() - this.lastUpdated > REFRESH_INTERVAL_MS * 2;
    if (stale) {
      await this.refreshMetrics();
    }
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  // Expose the registry to integrate with global collectors if needed
  getRegistry(): Registry {
    return this.registry;
  }

  async getRealtimeSnapshot(): Promise<RealtimeMetricsSnapshot> {
    const queues = await this.queueHealthService.getOverview();
    const totals = queues.reduce<RealtimeQueueTotals>(
      (acc, queue) => {
        const counts = queue.counts ?? {};
        acc.waiting += counts.waiting ?? 0;
        acc.delayed += counts.delayed ?? 0;
        acc.active += counts.active ?? 0;
        acc.failed += counts.failed ?? 0;
        acc.completed += counts.completed ?? 0;
        return acc;
      },
      { waiting: 0, delayed: 0, active: 0, failed: 0, completed: 0 },
    );

    const memoryUsage = process.memoryUsage();
    const system: SystemHealthSnapshot = {
      loadAvg1m: os.loadavg()[0] ?? 0,
      memoryRss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      uptimeSeconds: process.uptime(),
    };

    return {
      timestamp: new Date().toISOString(),
      queues,
      totals,
      system,
    };
  }
}

