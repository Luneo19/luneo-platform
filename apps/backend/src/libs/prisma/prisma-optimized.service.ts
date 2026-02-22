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
    try {
      // Retry logic avec backoff exponentiel
      let retries = 3;
      let delay = 1000;
      
      while (retries > 0) {
        try {
          await this.$connect();
          this.logger.log('Prisma connected to database');
          return;
        } catch (error: unknown) {
          retries--;
          const errMsg = error instanceof Error ? error.message : String(error);
          if (retries === 0) {
            this.logger.error('❌ Failed to connect to database', errMsg);
            // Ne pas throw pour permettre à l'application de démarrer en mode dégradé
            // L'application pourra toujours répondre aux health checks
            this.logger.warn('⚠️ Application starting in degraded mode (database unavailable)');
            return;
          }
          this.logger.warn(`⚠️ Database connection failed, retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Backoff exponentiel
        }
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ Failed to connect to database', errMsg);
      this.logger.warn('⚠️ Application starting in degraded mode (database unavailable)');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }


  /**
   * Find many with cache
   */
  async findManyWithCache<T>(
    model: { findMany: (args: unknown) => Promise<T[]> },
    args: unknown,
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
    model: { findUnique: (args: unknown) => Promise<T | null> },
    args: unknown,
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
    model: { count: (args: unknown) => Promise<number> },
    args: unknown,
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
    model: { aggregate: (args: unknown) => Promise<unknown> },
    args: unknown,
    cacheKey: string,
    cacheType: string = 'analytics',
    ttl?: number
  ): Promise<unknown> {
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
    const result = await this.$transaction(fn as unknown as Parameters<this['$transaction']>[0]);

    // Invalider le cache après la transaction
    for (const pattern of invalidatePatterns) {
      await this.invalidateCachePattern(pattern);
    }

    return result as T;
  }

  /**
   * Optimized query for dashboard metrics
   */
  async getDashboardMetrics(organizationId: string) {
    const cacheKey = `dashboard:metrics:${organizationId}`;
    
    try {
      const cached = await this.redisService.get(cacheKey, 'analytics');
      if (cached) {
        return cached;
      }

      const [designsCount, ordersCount, revenue, usersCount] = await Promise.all([
        // @ts-expect-error V2 migration
        this.design.count({ where: { organizationId } }),
        // @ts-expect-error V2 migration
        this.order.count({ 
          where: { 
            organizationId, 
            status: { in: ['PAID', 'DELIVERED'] } 
          } 
        }),
        // @ts-expect-error V2 migration
        this.order.aggregate({
          where: { 
            organizationId, 
            status: { in: ['PAID', 'DELIVERED'] } 
          },
          _sum: { totalCents: true }
        }),
        // @ts-expect-error V2 migration
        this.user.count({ where: { organizationId } })
      ]);

      const metrics = {
        designsCount,
        ordersCount,
        revenue: revenue._sum.totalCents || 0,
        usersCount,
        lastUpdated: new Date().toISOString()
      };

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
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    filters: Record<string, unknown> = {}
  ) {
    const cacheKey = `products:${organizationId}:${page}:${limit}:${JSON.stringify(filters)}`;
    
    try {
      const cached = await this.redisService.get(cacheKey, 'product');
      if (cached) {
        return cached;
      }

      const skip = (page - 1) * limit;
      
      const [products, total] = await Promise.all([
        // @ts-expect-error V2 migration — product model removed in V2
        this.product.findMany({
          where: {
            organizationId,
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
        // @ts-expect-error V2 migration — product model removed in V2
        this.product.count({
          where: {
            organizationId,
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
