import { Global, Module } from '@nestjs/common';
import { SlidingWindowRateLimitService } from './sliding-window.service';
import { RateLimitGuard } from './rate-limit.guard';
import { RedisOptimizedModule } from '../redis/redis-optimized.module';

@Global()
@Module({
  imports: [RedisOptimizedModule],
  providers: [SlidingWindowRateLimitService, RateLimitGuard],
  exports: [SlidingWindowRateLimitService, RateLimitGuard],
})
export class RateLimitModule {}

