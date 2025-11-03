import { Global, Module } from '@nestjs/common';
import { SmartCacheService } from './smart-cache.service';
import { RedisOptimizedModule } from '../redis/redis-optimized.module';
import { PrismaOptimizedModule } from '../prisma/prisma-optimized.module';

@Global()
@Module({
  imports: [RedisOptimizedModule, PrismaOptimizedModule],
  providers: [SmartCacheService],
  exports: [SmartCacheService],
})
export class SmartCacheModule {}


