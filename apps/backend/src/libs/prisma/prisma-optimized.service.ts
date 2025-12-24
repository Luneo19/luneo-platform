import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RedisOptimizedService } from '../redis/redis-optimized.service';

@Injectable()
export class PrismaOptimizedService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaOptimizedService.name);

  constructor(private readonly redisService: RedisOptimizedService) {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }


  /**
   * Find many with cache
   */
  async findManyWithCache<T>(
    model: any,
    args: any,
    cacheKey: string,
    cacheType: string = 'api',
    ttl?: number
  ): Promise<T[]> {
    try {
      // Essayer de récupérer depuis le cache
      const cached = await this.redisService.get<T[]>(cacheKey, cacheType);
      if (cached) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached;
      }

      // Si pas en cache, exécuter la requête
      this.logger.debug(`Cache miss for key: ${cacheKey}, executing query`);
      const result = await model.findMany(args);

      // Mettre en cache le résultat
      await this.redisService.set(cacheKey, result, cacheType, { ttl });

      return result;
    } catch (error) {
      this.logger.error(`Error in findManyWithCache for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Find unique with cache
   */
  async findUniqueWithCache<T>(
    model: any,
    args: any,
    cacheKey: string,
    cacheType: string = 'api',
    ttl?: number
  ): Promise<T | null> {
    try {
      // Essayer de récupérer depuis le cache
      const cached = await this.redisService.get<T>(cacheKey, cacheType);
      if (cached) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached;
      }

      // Si pas en cache, exécuter la requête
      this.logger.debug(`Cache miss for key: ${cacheKey}, executing query`);
      const result = await model.findUnique(args);

      // Mettre en cache le résultat (même si null)
      await this.redisService.set(cacheKey, result, cacheType, { ttl });

      return result;
    } catch (error) {
      this.logger.error(`Error in findUniqueWithCache for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Count with cache
   */
  async countWithCache(
    model: any,
    args: any,
    cacheKey: string,
    cacheType: string = 'api',
    ttl?: number
  ): Promise<number> {
    try {
      // Essayer de récupérer depuis le cache
      const cached = await this.redisService.get<number>(cacheKey, cacheType);
      if (cached !== null) {
        this.logger.debug(`Cache hit for count key: ${cacheKey}`);
        return cached;
      }

      // Si pas en cache, exécuter la requête
      this.logger.debug(`Cache miss for count key: ${cacheKey}, executing query`);
      const result = await model.count(args);

      // Mettre en cache le résultat
      await this.redisService.set(cacheKey, result, cacheType, { ttl });

      return result;
    } catch (error) {
      this.logger.error(`Error in countWithCache for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Aggregation with cache
   */
  async aggregateWithCache(
    model: any,
    args: any,
    cacheKey: string,
    cacheType: string = 'analytics',
    ttl?: number
  ): Promise<any> {
    try {
      // Essayer de récupérer depuis le cache
      const cached = await this.redisService.get(cacheKey, cacheType);
      if (cached) {
        this.logger.debug(`Cache hit for aggregate key: ${cacheKey}`);
        return cached;
      }

      // Si pas en cache, exécuter la requête
      this.logger.debug(`Cache miss for aggregate key: ${cacheKey}, executing query`);
      const result = await model.aggregate(args);

      // Mettre en cache le résultat
      await this.redisService.set(cacheKey, result, cacheType, { ttl });

      return result;
    } catch (error) {
      this.logger.error(`Error in aggregateWithCache for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache after write operations
   */
  async invalidateCachePattern(pattern: string): Promise<void> {
    try {
      await this.redisService.invalidateByTags([pattern]);
      this.logger.debug(`Cache invalidated for pattern: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Transaction with cache invalidation
   */
  async transactionWithCacheInvalidation<T>(
    fn: (tx: Omit<PrismaClient, '$on' | '$connect' | '$disconnect' | '$use' | '$transaction' | '$extends'>) => Promise<T>,
    invalidatePatterns: string[] = []
  ): Promise<T> {
    const result = await this.$transaction(fn as any);

    // Invalider le cache après la transaction
    for (const pattern of invalidatePatterns) {
      await this.invalidateCachePattern(pattern);
    }

    return result as T;
  }

  /**
   * Optimized query for dashboard metrics
   */
  async getDashboardMetrics(brandId: string) {
    const cacheKey = `dashboard:metrics:${brandId}`;
    
    try {
      const cached = await this.redisService.get(cacheKey, 'analytics');
      if (cached) {
        return cached;
      }

      const [designsCount, ordersCount, revenue, usersCount] = await Promise.all([
        this.design.count({ where: { brandId } }),
        this.order.count({ 
          where: { 
            brandId, 
            status: { in: ['PAID', 'DELIVERED'] } 
          } 
        }),
        this.order.aggregate({
          where: { 
            brandId, 
            status: { in: ['PAID', 'DELIVERED'] } 
          },
          _sum: { totalCents: true }
        }),
        this.user.count({ where: { brandId } })
      ]);

      const metrics = {
        designsCount,
        ordersCount,
        revenue: revenue._sum.totalCents || 0,
        usersCount,
        lastUpdated: new Date().toISOString()
      };

      // Cache pour 5 minutes
      await this.redisService.set(cacheKey, metrics, 'analytics', { ttl: 300 });

      return metrics;
    } catch (error) {
      this.logger.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Optimized query for products with pagination and filters
   */
  async getProductsOptimized(
    brandId: string,
    page: number = 1,
    limit: number = 20,
    filters: any = {}
  ) {
    const cacheKey = `products:${brandId}:${page}:${limit}:${JSON.stringify(filters)}`;
    
    try {
      const cached = await this.redisService.get(cacheKey, 'product');
      if (cached) {
        return cached;
      }

      const skip = (page - 1) * limit;
      
      const [products, total] = await Promise.all([
        this.product.findMany({
          where: {
            brandId,
            ...filters
          },
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            images: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                designs: true,
                orders: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.product.count({
          where: {
            brandId,
            ...filters
          }
        })
      ]);

      const result = {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // Cache pour 2 heures
      await this.redisService.set(cacheKey, result, 'product', { ttl: 7200 });

      return result;
    } catch (error) {
      this.logger.error('Error getting optimized products:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    
    try {
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        latency: Date.now() - start
      };
    }
  }
}
