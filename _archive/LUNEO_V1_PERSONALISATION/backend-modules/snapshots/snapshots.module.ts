import { Module } from '@nestjs/common';
import { SnapshotsController } from './snapshots.controller';
import { SnapshotsService } from './snapshots.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';

@Module({
  imports: [PrismaModule, SmartCacheModule, RedisOptimizedModule], // IdempotencyGuard, IdempotencyInterceptor need RedisOptimizedService
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}











