import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Record performance metric
   */
  async recordMetric(metric: PerformanceMetric): Promise<void> {
    try {
      // Add to memory cache
      this.metrics.push(metric);
      
      // Keep only last maxMetrics
      if (this.metrics.length > this.maxMetrics) {
        this.metrics.shift();
      }

      // Store in database (async, non-blocking)
      this.storeMetricAsync(metric).catch((error) => {
        this.logger.error('Failed to store performance metric', error);
      });
    } catch (error) {
      this.logger.error('Failed to record performance metric', error);
    }
  }

  /**
   * Store metric in database (async)
   */
  private async storeMetricAsync(metric: PerformanceMetric): Promise<void> {
    try {
      // Store in MonitoringMetric table using the correct schema
      await this.prisma.monitoringMetric.create({
        data: {
          service: 'api',
          metric: 'request_duration',
          value: metric.duration,
          unit: 'ms',
          labels: {
            endpoint: metric.endpoint,
            method: metric.method,
            statusCode: metric.statusCode,
            userId: metric.userId,
            ip: metric.ip,
            userAgent: metric.userAgent,
          },
          timestamp: metric.timestamp,
        },
      });
    } catch (error) {
      // Table might not exist or schema different, log and continue
      this.logger.debug('MonitoringMetric table not available or schema mismatch', error);
    }
  }

  /**
   * Get performance statistics
   */
  async getStats(
    endpoint?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    p99Duration: number;
    requestCount: number;
    errorRate: number;
  }> {
    let filteredMetrics = this.metrics;

    // Filter by endpoint
    if (endpoint) {
      filteredMetrics = filteredMetrics.filter((m) => m.endpoint === endpoint);
    }

    // Filter by date range
    if (startDate || endDate) {
      filteredMetrics = filteredMetrics.filter((m) => {
        if (startDate && m.timestamp < startDate) return false;
        if (endDate && m.timestamp > endDate) return false;
        return true;
      });
    }

    if (filteredMetrics.length === 0) {
      return {
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        requestCount: 0,
        errorRate: 0,
      };
    }

    const durations = filteredMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const errors = filteredMetrics.filter((m) => m.statusCode >= 400).length;

    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      p99Duration: durations[Math.floor(durations.length * 0.99)],
      requestCount: filteredMetrics.length,
      errorRate: errors / filteredMetrics.length,
    };
  }

  /**
   * Get slow endpoints (above threshold)
   */
  async getSlowEndpoints(threshold: number = 1000): Promise<
    Array<{
      endpoint: string;
      method: string;
      avgDuration: number;
      requestCount: number;
    }>
  > {
    const endpointMap = new Map<string, { durations: number[]; count: number }>();

    this.metrics.forEach((metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, { durations: [], count: 0 });
      }
      const entry = endpointMap.get(key)!;
      entry.durations.push(metric.duration);
      entry.count++;
    });

    const slowEndpoints: Array<{
      endpoint: string;
      method: string;
      avgDuration: number;
      requestCount: number;
    }> = [];

    endpointMap.forEach((value, key) => {
      const avgDuration =
        value.durations.reduce((a, b) => a + b, 0) / value.durations.length;
      if (avgDuration > threshold) {
        const [method, ...endpointParts] = key.split(' ');
        slowEndpoints.push({
          method,
          endpoint: endpointParts.join(' '),
          avgDuration,
          requestCount: value.count,
        });
      }
    });

    return slowEndpoints.sort((a, b) => b.avgDuration - a.avgDuration);
  }
}
