import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';
import { QueueHealthService } from '@/jobs/services/queue-health.service';

interface MonitoringConfig {
  queueAlertWaitThreshold: number;
  queueAlertOldestSeconds: number;
  queueAlertIntervalSeconds: number;
}

@Injectable()
export class QueueHealthAlertService {
  private readonly logger = new Logger(QueueHealthAlertService.name);
  private readonly lastAlerts = new Map<string, number>();
  private readonly waitThreshold: number;
  private readonly oldestSecondsThreshold: number;
  private readonly minIntervalMs: number;

  constructor(
    private readonly queueHealthService: QueueHealthService,
    private readonly configService: ConfigService,
  ) {
    const monitoring = this.configService.get<MonitoringConfig>('monitoring');
    this.waitThreshold = monitoring?.queueAlertWaitThreshold ?? 250;
    this.oldestSecondsThreshold = monitoring?.queueAlertOldestSeconds ?? 300;
    this.minIntervalMs = (monitoring?.queueAlertIntervalSeconds ?? 300) * 1000;
  }

  @Interval(60_000)
  async checkQueues(): Promise<void> {
    try {
      const overview = await this.queueHealthService.getOverview();
      const now = Date.now();

      for (const queue of overview) {
        const waiting = queue.counts.waiting ?? 0;
        const delayed = queue.counts.delayed ?? 0;
        const oldestWaitingSeconds = queue.oldestWaitingAt
          ? Math.max(0, (now - new Date(queue.oldestWaitingAt).getTime()) / 1000)
          : 0;

        const isUnhealthy = !queue.isHealthy;
        const waitingExceeded = waiting + delayed > this.waitThreshold;
        const oldestExceeded = oldestWaitingSeconds > this.oldestSecondsThreshold;

        if (!(isUnhealthy || waitingExceeded || oldestExceeded)) {
          continue;
        }

        const key = queue.name;
        const lastAlert = this.lastAlerts.get(key) ?? 0;
        if (now - lastAlert < this.minIntervalMs) {
          continue;
        }

        this.lastAlerts.set(key, now);
        const context = {
          queue: queue.name,
          counts: queue.counts,
          waiting,
          delayed,
          oldestWaitingSeconds,
          lastFailedJobId: queue.lastFailedJobId,
          lastFailedReason: queue.lastFailedReason,
          lastFailedAt: queue.lastFailedAt,
        };

        this.logger.warn(`Queue alert triggered`, context);
        Sentry.captureMessage(`Queue ${queue.name} degraded`, {
          level: 'warning',
          extra: context,
        });
      }
    } catch (error) {
      this.logger.error('Failed to evaluate queue health alerts', error instanceof Error ? error.stack : undefined);
    }
  }
}

