import { Global, Module } from '@nestjs/common';
import { RedisOptimizedService } from './redis-optimized.service';
import { DistributedLockService } from './distributed-lock.service';

@Global()
@Module({
  providers: [RedisOptimizedService, DistributedLockService],
  exports: [RedisOptimizedService, DistributedLockService],
})
export class RedisOptimizedModule {}

