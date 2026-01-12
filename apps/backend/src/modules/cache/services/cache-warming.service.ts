/**
 * Cache Warming Service
 * Pre-warms cache with frequently accessed data
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

@Injectable()
export class CacheWarmingService {
  private readonly logger = new Logger(CacheWarmingService.name);
  private isWarming = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisOptimizedService,
  ) {}

  /**
   * Warm up cache on application startup
   */
  async onApplicationBootstrap() {
    // Wait a bit for services to be ready
    setTimeout(() => {
      this.warmupCache().catch((error) => {
        this.logger.error('Failed to warmup cache on startup:', error);
      });
    }, 5000);
  }

  /**
   * Warm up cache with frequently accessed data
   */
  @Cron(CronExpression.EVERY_HOUR)
  async warmupCache(): Promise<void> {
    if (this.isWarming) {
      this.logger.warn('Cache warming already in progress, skipping...');
      return;
    }

    this.isWarming = true;
    this.logger.log('Starting cache warmup...');

    try {
      const startTime = Date.now();

      // Warm up popular products
      await this.warmupPopularProducts();

      // Warm up active brands
      await this.warmupActiveBrands();

      // Warm up analytics data
      await this.warmupAnalyticsData();

      // Warm up user sessions
      await this.warmupUserSessions();

      // Use cache extension warmup
      await this.cacheExtension.warmupCache();

      const duration = Date.now() - startTime;
      this.logger.log(`Cache warmup completed in ${duration}ms`);
    } catch (error) {
      this.logger.error('Cache warmup failed:', error);
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm up popular products cache
   */
  private async warmupPopularProducts(): Promise<void> {
    try {
      const products = await this.prisma.product.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: true,
        },
      });

      for (const product of products) {
        await this.redis.set(
          `product:${product.id}`,
          product,
          'product',
          { ttl: 7200, tags: ['products', `brand:${product.brandId}`] },
        );
      }

      this.logger.log(`Warmed up ${products.length} popular products`);
    } catch (error) {
      this.logger.error('Failed to warmup popular products:', error);
    }
  }

  /**
   * Warm up active brands cache
   */
  private async warmupActiveBrands(): Promise<void> {
    try {
      const brands = await this.prisma.brand.findMany({
        take: 100,
        where: { 
          status: 'ACTIVE', // Use status field instead of isActive
        },
        include: {
          _count: {
            select: {
              users: true,
              products: true,
            },
          },
        },
      });

      for (const brand of brands) {
        await this.redis.set(
          `brand:${brand.id}`,
          brand,
          'brand',
          { ttl: 3600, tags: ['brands'] },
        );
      }

      this.logger.log(`Warmed up ${brands.length} active brands`);
    } catch (error) {
      this.logger.error('Failed to warmup active brands:', error);
    }
  }

  /**
   * Warm up analytics data cache
   */
  private async warmupAnalyticsData(): Promise<void> {
    try {
      // Warm up daily analytics summary
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const analyticsData = {
        date: today.toISOString(),
        totalUsers: await this.prisma.user.count(),
        totalProducts: await this.prisma.product.count(),
        totalOrders: await this.prisma.order.count(),
        totalRevenue: await this.calculateTotalRevenue(),
      };

      await this.redis.set(
        `analytics:daily:${today.toISOString().split('T')[0]}`,
        analyticsData,
        'analytics',
        { ttl: 300, tags: ['analytics', 'daily'] },
      );

      this.logger.log('Warmed up analytics data');
    } catch (error) {
      this.logger.error('Failed to warmup analytics data:', error);
    }
  }

  /**
   * Warm up user sessions cache
   */
  private async warmupUserSessions(): Promise<void> {
    try {
      // Warm up active user sessions (last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const activeUsers = await this.prisma.user.findMany({
        take: 100,
        where: {
          lastLoginAt: {
            gte: yesterday,
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          brandId: true,
        },
      });

      for (const user of activeUsers) {
        await this.redis.set(
          `user:${user.id}`,
          user,
          'user',
          { ttl: 1800, tags: ['users', `brand:${user.brandId}`] },
        );
      }

      this.logger.log(`Warmed up ${activeUsers.length} active user sessions`);
    } catch (error) {
      this.logger.error('Failed to warmup user sessions:', error);
    }
  }

  /**
   * Calculate total revenue (cached)
   */
  private async calculateTotalRevenue(): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'DELIVERED', // Use DELIVERED instead of COMPLETED
      },
      select: {
        totalCents: true,
      },
    });

    return orders.reduce((sum, order) => sum + (order.totalCents || 0), 0) / 100;
  }

  /**
   * Manual cache warmup trigger
   */
  async triggerWarmup(): Promise<{ success: boolean; message: string }> {
    if (this.isWarming) {
      return {
        success: false,
        message: 'Cache warming already in progress',
      };
    }

    this.warmupCache().catch((error) => {
      this.logger.error('Manual cache warmup failed:', error);
    });

    return {
      success: true,
      message: 'Cache warmup triggered',
    };
  }
}
