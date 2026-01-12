/**
 * Grafana Datasource Service
 * Provides data for Grafana dashboards
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

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
   * Get requests per second metrics
   */
  private async getRequestsPerSecond(startTime: Date, endTime: Date) {
    // In real scenario, this would query from metrics storage
    // For now, return mock data structure
    const points = [];
    const interval = 60000; // 1 minute intervals
    let current = new Date(startTime);

    while (current <= endTime) {
      points.push({
        time: current.getTime(),
        value: Math.random() * 100, // Mock value
      });
      current = new Date(current.getTime() + interval);
    }

    return points;
  }

  /**
   * Get response time metrics
   */
  private async getResponseTime(startTime: Date, endTime: Date) {
    const points = [];
    const interval = 60000;
    let current = new Date(startTime);

    while (current <= endTime) {
      points.push({
        time: current.getTime(),
        value: Math.random() * 500, // Mock response time in ms
      });
      current = new Date(current.getTime() + interval);
    }

    return points;
  }

  /**
   * Get error rate metrics
   */
  private async getErrorRate(startTime: Date, endTime: Date) {
    const points = [];
    const interval = 60000;
    let current = new Date(startTime);

    while (current <= endTime) {
      points.push({
        time: current.getTime(),
        value: Math.random() * 5, // Mock error rate percentage
      });
      current = new Date(current.getTime() + interval);
    }

    return points;
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
   * Get database queries metrics
   */
  private async getDatabaseQueries(startTime: Date, endTime: Date) {
    // In real scenario, would query from database metrics
    const points = [];
    const interval = 60000;
    let current = new Date(startTime);

    while (current <= endTime) {
      points.push({
        time: current.getTime(),
        value: Math.random() * 1000, // Mock query count
      });
      current = new Date(current.getTime() + interval);
    }

    return points;
  }

  /**
   * Get cache hit rate metrics
   */
  private async getCacheHitRate(startTime: Date, endTime: Date) {
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
