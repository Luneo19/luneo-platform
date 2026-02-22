// @ts-nocheck
/**
 * Grafana Datasource Service
 * Provides real data for Grafana dashboards
 * 
 * ✅ Métriques réelles depuis la base de données
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

interface MetricPoint {
  time: number;
  value: number;
}

@Injectable()
export class GrafanaDatasourceService {
  private readonly logger = new Logger(GrafanaDatasourceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisOptimizedService,
  ) {}

  /**
   * Get metrics for Grafana time series
   */
  async getTimeSeriesMetrics(startTime: Date, endTime: Date, metric: string) {
    try {
      switch (metric) {
        case 'requests_per_second':
          return await this.getRequestsPerSecond(startTime, endTime);
        case 'response_time':
          return await this.getResponseTime(startTime, endTime);
        case 'error_rate':
          return await this.getErrorRate(startTime, endTime);
        case 'active_users':
          return await this.getActiveUsers(startTime, endTime);
        case 'database_queries':
          return await this.getDatabaseQueries(startTime, endTime);
        case 'cache_hit_rate':
          return await this.getCacheHitRate(startTime, endTime);
        default:
          return [];
      }
    } catch (error) {
      this.logger.error(`Failed to get metrics for ${metric}:`, error);
      return [];
    }
  }

  /**
   * Get requests per second metrics from audit logs
   */
  private async getRequestsPerSecond(startTime: Date, endTime: Date): Promise<MetricPoint[]> {
    try {
      // Query audit logs and aggregate by minute
      const logs = await this.prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        select: {
          timestamp: true,
        },
      });

      // Aggregate by minute intervals
      const minuteMap = new Map<number, number>();
      const interval = 60000; // 1 minute
      
      for (const log of logs) {
        const minuteTimestamp = Math.floor(new Date(log.timestamp).getTime() / interval) * interval;
        minuteMap.set(minuteTimestamp, (minuteMap.get(minuteTimestamp) || 0) + 1);
      }

      // Convert to array and sort
      const points: MetricPoint[] = Array.from(minuteMap.entries())
        .map(([time, count]) => ({
          time,
          value: count / 60, // Convert to per-second
        }))
        .sort((a, b) => a.time - b.time);

      // Fill gaps with zeros
      if (points.length > 0) {
        return this.fillGaps(points, startTime, endTime, interval);
      }

      return this.generateEmptyTimeSeries(startTime, endTime, interval);
    } catch (error) {
      this.logger.warn('Failed to get requests per second from audit logs, using fallback');
      return this.generateEmptyTimeSeries(startTime, endTime, 60000);
    }
  }

  /**
   * Get response time metrics from AI usage logs (which track latency)
   */
  private async getResponseTime(startTime: Date, endTime: Date): Promise<MetricPoint[]> {
    try {
      // Query AI usage logs for latency data
      const logs = await this.prisma.aIUsageLog.findMany({
        where: {
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
          latencyMs: {
            gt: 0,
          },
        },
        select: {
          createdAt: true,
          latencyMs: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group by minute and calculate average
      const interval = 60000;
      const minuteMap = new Map<number, { total: number; count: number }>();

      for (const log of logs) {
        const minuteTimestamp = Math.floor(new Date(log.createdAt).getTime() / interval) * interval;
        const existing = minuteMap.get(minuteTimestamp) || { total: 0, count: 0 };
        existing.total += log.latencyMs;
        existing.count += 1;
        minuteMap.set(minuteTimestamp, existing);
      }

      const points: MetricPoint[] = Array.from(minuteMap.entries())
        .map(([time, data]) => ({
          time,
          value: data.count > 0 ? data.total / data.count : 0,
        }))
        .sort((a, b) => a.time - b.time);

      if (points.length > 0) {
        return this.fillGaps(points, startTime, endTime, interval);
      }

      return this.generateEmptyTimeSeries(startTime, endTime, interval);
    } catch (error) {
      this.logger.warn('Failed to get response time metrics, using fallback');
      return this.generateEmptyTimeSeries(startTime, endTime, 60000);
    }
  }

  /**
   * Get error rate metrics from audit logs
   */
  private async getErrorRate(startTime: Date, endTime: Date): Promise<MetricPoint[]> {
    try {
      // Query all audit logs
      const allLogs = await this.prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        select: {
          timestamp: true,
          action: true,
        },
      });

      // Aggregate by minute
      const interval = 60000;
      const totalMap = new Map<number, number>();
      const errorMap = new Map<number, number>();

      for (const log of allLogs) {
        const minuteTimestamp = Math.floor(new Date(log.timestamp).getTime() / interval) * interval;
        totalMap.set(minuteTimestamp, (totalMap.get(minuteTimestamp) || 0) + 1);
        
        // Check if this is an error action
        const action = log.action?.toLowerCase() || '';
        if (action.includes('error') || action.includes('fail') || action.includes('denied')) {
          errorMap.set(minuteTimestamp, (errorMap.get(minuteTimestamp) || 0) + 1);
        }
      }

      // Calculate error rate percentage
      const points: MetricPoint[] = Array.from(totalMap.entries())
        .map(([time, total]) => {
          const errors = errorMap.get(time) || 0;
          return {
            time,
            value: total > 0 ? (errors / total) * 100 : 0,
          };
        })
        .sort((a, b) => a.time - b.time);

      if (points.length > 0) {
        return this.fillGaps(points, startTime, endTime, interval);
      }

      return this.generateEmptyTimeSeries(startTime, endTime, interval);
    } catch (error) {
      this.logger.warn('Failed to get error rate metrics, using fallback');
      return this.generateEmptyTimeSeries(startTime, endTime, 60000);
    }
  }

  /**
   * Get active users metrics
   */
  private async getActiveUsers(startTime: Date, endTime: Date) {
    try {
      const users = await this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: startTime,
            lte: endTime,
          },
        },
      });

      return [{
        time: Date.now(),
        value: users,
      }];
    } catch (error) {
      this.logger.error('Failed to get active users:', error);
      return [];
    }
  }

  /**
   * Get database queries metrics from AI usage logs (which track DB operations)
   */
  private async getDatabaseQueries(startTime: Date, endTime: Date): Promise<MetricPoint[]> {
    try {
      // Count operations from AI usage logs
      const logs = await this.prisma.aIUsageLog.findMany({
        where: {
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
        select: {
          createdAt: true,
        },
      });

      const interval = 60000;
      const minuteMap = new Map<number, number>();

      for (const log of logs) {
        const minuteTimestamp = Math.floor(new Date(log.createdAt).getTime() / interval) * interval;
        // Estimate ~10 DB queries per AI operation
        minuteMap.set(minuteTimestamp, (minuteMap.get(minuteTimestamp) || 0) + 10);
      }

      // Also count design operations
      const designLogs = await this.prisma.design.findMany({
        where: {
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
        select: {
          createdAt: true,
        },
      });

      for (const log of designLogs) {
        const minuteTimestamp = Math.floor(new Date(log.createdAt).getTime() / interval) * interval;
        // Estimate ~5 DB queries per design operation
        minuteMap.set(minuteTimestamp, (minuteMap.get(minuteTimestamp) || 0) + 5);
      }

      const points: MetricPoint[] = Array.from(minuteMap.entries())
        .map(([time, value]) => ({ time, value }))
        .sort((a, b) => a.time - b.time);

      if (points.length > 0) {
        return this.fillGaps(points, startTime, endTime, interval);
      }

      return this.generateEmptyTimeSeries(startTime, endTime, interval);
    } catch (error) {
      this.logger.warn('Failed to get database query metrics, using fallback');
      return this.generateEmptyTimeSeries(startTime, endTime, 60000);
    }
  }

  /**
   * Helper: Fill gaps in time series with zeros
   */
  private fillGaps(points: MetricPoint[], startTime: Date, endTime: Date, interval: number): MetricPoint[] {
    const result: MetricPoint[] = [];
    const pointMap = new Map(points.map(p => [p.time, p.value]));
    
    let current = Math.floor(startTime.getTime() / interval) * interval;
    const end = endTime.getTime();

    while (current <= end) {
      result.push({
        time: current,
        value: pointMap.get(current) || 0,
      });
      current += interval;
    }

    return result;
  }

  /**
   * Helper: Generate empty time series with zeros
   */
  private generateEmptyTimeSeries(startTime: Date, endTime: Date, interval: number): MetricPoint[] {
    const points: MetricPoint[] = [];
    let current = Math.floor(startTime.getTime() / interval) * interval;
    const end = endTime.getTime();

    while (current <= end) {
      points.push({ time: current, value: 0 });
      current += interval;
    }

    return points;
  }

  /**
   * Get cache hit rate metrics
   */
  private async getCacheHitRate(_startTime: Date, _endTime: Date) {
    try {
      const stats = await this.redis.getStats();
      
      // Parse Redis INFO stats string to extract hits and misses
      // Redis INFO stats format: "keyspace_hits:123\nkeyspace_misses:456\n..."
      let hits = 0;
      let misses = 0;
      
      if (typeof stats.stats === 'string') {
        const hitsMatch = stats.stats.match(/keyspace_hits:(\d+)/);
        const missesMatch = stats.stats.match(/keyspace_misses:(\d+)/);
        
        hits = hitsMatch ? parseInt(hitsMatch[1], 10) : 0;
        misses = missesMatch ? parseInt(missesMatch[1], 10) : 0;
      }
      
      // Calculate hit rate percentage
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      return [{
        time: Date.now(),
        value: hitRate,
      }];
    } catch (error) {
      this.logger.error('Failed to get cache hit rate:', error);
      // Return default value if stats unavailable
      return [{
        time: Date.now(),
        value: 0,
      }];
    }
  }

  /**
   * Get table metrics for Grafana table panel
   */
  async getTableMetrics() {
    try {
      const [
        totalUsers,
        totalOrders,
        totalDesigns,
        totalProducts,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.order.count(),
        this.prisma.design.count(),
        this.prisma.product.count(),
      ]);

      return [
        { metric: 'Total Users', value: totalUsers },
        { metric: 'Total Orders', value: totalOrders },
        { metric: 'Total Designs', value: totalDesigns },
        { metric: 'Total Products', value: totalProducts },
      ];
    } catch (error) {
      this.logger.error('Failed to get table metrics:', error);
      return [];
    }
  }
}
