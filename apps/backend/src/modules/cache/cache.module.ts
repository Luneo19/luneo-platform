import { Module, Global } from '@nestjs/common';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { EnhancedCacheableInterceptor } from '@/libs/cache/enhanced-cacheable.interceptor';
import { CacheInvalidationService } from '@/libs/cache/cache-invalidation.service';

/**
 * Global Cache Module
 * Provides caching functionality across all modules
 */
@Global()
@Module({
  imports: [RedisOptimizedModule],
  providers: [
    EnhancedCacheableInterceptor,
    CacheInvalidationService,
  ],
  exports: [
    EnhancedCacheableInterceptor,
    CacheInvalidationService,
  ],
})
export class CacheModule {}
