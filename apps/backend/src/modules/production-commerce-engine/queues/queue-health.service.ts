import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PCE_QUEUES } from '../pce.constants';
import { InjectPCEQueue, PCEQueue } from './pce-queue.provider';
import { QueueMonitorService } from './queue-monitor.service';

@Injectable()
export class QueueHealthService extends HealthIndicator {
  private readonly logger = new Logger(QueueHealthService.name);

  constructor(
    @InjectPCEQueue(PCE_QUEUES.PIPELINE) private readonly pipelineQueue: PCEQueue,
    private readonly queueMonitor: QueueMonitorService,
  ) {
    super();
  }

  async isRedisConnected(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.pipelineQueue.getJobCounts();
      return this.getStatus(key, true, { redis: 'connected' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Queue Redis health check: ${message}`);
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false, { error: message }));
    }
  }

  async areQueuesOperational(key: string): Promise<HealthIndicatorResult> {
    try {
      const data = await this.queueMonitor.getDashboardData();
      const failedTotal = data.queues.reduce((sum, q) => sum + q.failed, 0);
      const waitingTotal = data.queues.reduce((sum, q) => sum + q.waiting, 0);
      const healthy = data.alerts.filter((a) => a.severity === 'error').length === 0;
      return this.getStatus(key, healthy, {
        queues: data.queues.length,
        totalFailed: failedTotal,
        totalWaiting: waitingTotal,
        alerts: data.alerts.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new HealthCheckError('Queues check failed', this.getStatus(key, false, { error: message }));
    }
  }

  async getDetailedStatus(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: Record<string, unknown> }> {
    try {
      const data = await this.queueMonitor.getDashboardData();
      const errorAlerts = data.alerts.filter((a) => a.severity === 'error');
      const warningAlerts = data.alerts.filter((a) => a.severity === 'warning');
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (errorAlerts.length > 0) status = 'unhealthy';
      else if (warningAlerts.length > 0) status = 'degraded';
      return {
        status,
        details: {
          queues: data.queues,
          alerts: data.alerts,
          timestamp: data.timestamp,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'unhealthy', details: { error: message } };
    }
  }
}
