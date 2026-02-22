import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';

@Module({
  imports: [PrismaModule, RedisOptimizedModule],
  providers: [],
  exports: [],
})
export class CacheModule {}
