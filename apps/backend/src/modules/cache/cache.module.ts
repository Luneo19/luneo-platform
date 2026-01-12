import { Module } from '@nestjs/common';
import { CacheWarmingService } from './services/cache-warming.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';

@Module({
  imports: [PrismaModule, RedisOptimizedModule],
  providers: [CacheWarmingService],
  exports: [CacheWarmingService],
})
export class CacheModule {}
