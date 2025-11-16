import { Logger, OnModuleDestroy } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { QueueMetricsService } from './queue-metrics.service';
import { Counter, Gauge, Histogram } from 'prom-client';
import { OnEvent } from '@nestjs/event-emitter';
import * as Sentry from '@sentry/nestjs';
import {
  QUOTA_SUMMARY_EVENT,
  type QuotaSummaryEventPayload,
} from '@/modules/usage-billing/events/quota.events';

const BROADCAST_INTERVAL_MS = 5_000;

@WebSocketGateway({
  namespace: '/observability',
  cors: {
    origin: '*',
  },
})
export class ObservabilityGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(ObservabilityGateway.name);
  private activeConnections = 0;
  private broadcastTimer?: NodeJS.Timeout;
  private readonly quotaSnapshots = new Map<string, QuotaSummaryEventPayload>();
  private readonly wsConnectionsGauge: Gauge<string>;
  private readonly wsBroadcastDuration: Histogram<string>;
  private readonly wsBroadcastFailures: Counter<string>;
  private readonly wsLastSnapshotGauge: Gauge<string>;
  private consecutiveBroadcastFailures = 0;

  constructor(private readonly queueMetricsService: QueueMetricsService) {
    const registry = this.queueMetricsService.getRegistry();

    this.wsConnectionsGauge = new Gauge({
      name: 'luneo_observability_ws_active_connections',
      help: 'Number of active clients on the /observability namespace',
      registers: [registry],
    });

    this.wsBroadcastDuration = new Histogram({
      name: 'luneo_observability_ws_broadcast_duration_seconds',
      help: 'Duration of websocket snapshot broadcasts',
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [registry],
    });

    this.wsBroadcastFailures = new Counter({
      name: 'luneo_observability_ws_broadcast_failures_total',
      help: 'Total number of websocket broadcast failures',
      registers: [registry],
    });

    this.wsLastSnapshotGauge = new Gauge({
      name: 'luneo_observability_ws_last_snapshot_timestamp',
      help: 'Unix timestamp of the last successful websocket snapshot',
      registers: [registry],
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.debug(`Client connected to observability: ${client.id}`);
    this.activeConnections += 1;
    this.wsConnectionsGauge.set(this.activeConnections);

    await this.emitSnapshot(client).catch((error) =>
      this.logger.error(
        `Failed to send initial snapshot to client ${client.id}`,
        error instanceof Error ? error.stack : undefined,
      ),
    );
    this.emitQuotaBootstrap(client);

    if (!this.broadcastTimer) {
      this.logger.debug('Starting observability broadcast loop');
      this.broadcastTimer = setInterval(() => {
        void this.emitSnapshot().catch((error) =>
          this.logger.error(
            'Failed to broadcast observability snapshot',
            error instanceof Error ? error.stack : undefined,
          ),
        );
      }, BROADCAST_INTERVAL_MS);
    }
  }

  handleDisconnect(client: Socket): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    this.wsConnectionsGauge.set(this.activeConnections);
    this.logger.debug(
      `Client disconnected from observability: ${client.id} (remaining: ${this.activeConnections})`,
    );

    if (this.activeConnections === 0 && this.broadcastTimer) {
      this.logger.debug('Stopping observability broadcast loop (no clients)');
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = undefined;
    }
  }

  onModuleDestroy(): void {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
    }
  }

  private async emitSnapshot(targetClient?: Socket): Promise<void> {
    const start = process.hrtime.bigint();
    try {
      const snapshot = await this.queueMetricsService.getRealtimeSnapshot();
      if (targetClient) {
        targetClient.emit('metrics:update', snapshot);
      } else {
        this.server.emit('metrics:update', snapshot);
      }
      const durationSeconds =
        Number(process.hrtime.bigint() - start) / 1_000_000_000;
      this.wsBroadcastDuration.observe(durationSeconds);
      this.wsLastSnapshotGauge.set(Date.now() / 1000);
      this.consecutiveBroadcastFailures = 0;
    } catch (error) {
      this.wsBroadcastFailures.inc();
      this.consecutiveBroadcastFailures += 1;
      Sentry.withScope((scope) => {
        scope.setTag('component', 'observability-gateway');
        scope.setTag('namespace', '/observability');
        scope.setLevel('warning');
        scope.setExtra('consecutiveFailures', this.consecutiveBroadcastFailures);
        scope.setExtra('hasServer', Boolean(this.server));
        Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
      });
      if (this.consecutiveBroadcastFailures % 3 === 0) {
        Sentry.captureMessage('WebSocket broadcast failing repeatedly', {
          level: 'warning',
        });
      }
      throw error;
    }
  }

  private emitQuotaBootstrap(targetClient?: Socket): void {
    if (this.quotaSnapshots.size === 0) {
      return;
    }

    const payload = Array.from(this.quotaSnapshots.values());
    if (targetClient) {
      targetClient.emit('quota:bootstrap', payload);
      return;
    }

    if (!this.server) {
      return;
    }

    this.server.emit('quota:bootstrap', payload);
  }

  @OnEvent(QUOTA_SUMMARY_EVENT)
  handleQuotaSummaryUpdate(payload: QuotaSummaryEventPayload): void {
    this.quotaSnapshots.set(payload.brandId, payload);

    if (!this.server) {
      return;
    }

    this.server.emit('quota:update', payload);
  }
}

