/**
 * Prometheus metrics client for frontend
 * Sends metrics to backend /api/metrics endpoint
 */

interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  type: 'counter' | 'histogram' | 'gauge';
}

import { logger } from '../logger';

class PrometheusClient {
  private endpoint: string;
  private buffer: MetricData[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private timer?: NodeJS.Timeout;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_METRICS_ENDPOINT || '/api/metrics';
    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    if (typeof window === 'undefined') return;
    
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metrics = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      });
    } catch (error) {
      logger.error('Failed to send metrics', {
        error,
        metricsCount: metrics.length,
        endpoint: this.endpoint,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      // Re-add to buffer on failure
      this.buffer.unshift(...metrics);
    }
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.buffer.push({ name, value, labels, type: 'histogram' });
    // Flush immediately for critical metrics
    if (this.buffer.length >= 10) {
      this.flush();
    }
  }

  recordCounter(name: string, labels?: Record<string, string>): void {
    this.buffer.push({ name, value: 1, labels, type: 'counter' });
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.buffer.push({ name, value, labels, type: 'gauge' });
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }
}

export const metricsClient = typeof window !== 'undefined' ? new PrometheusClient() : null;
