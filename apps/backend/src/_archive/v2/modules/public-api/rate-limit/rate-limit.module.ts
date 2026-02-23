import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [SmartCacheModule],
  providers: [RateLimitService, RateLimitGuard],
  exports: [RateLimitService, RateLimitGuard],
})
export class RateLimitModule {}


