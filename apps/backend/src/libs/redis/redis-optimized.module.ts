import { Global, Module } from '@nestjs/common';
import { RedisOptimizedService } from './redis-optimized.service';

@Global()
@Module({
  providers: [RedisOptimizedService],
  exports: [RedisOptimizedService],
})
export class RedisOptimizedModule {}

