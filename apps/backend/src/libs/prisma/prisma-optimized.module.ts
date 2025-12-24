import { Global, Module } from '@nestjs/common';
import { PrismaOptimizedService } from './prisma-optimized.service';
import { RedisOptimizedModule } from '../redis/redis-optimized.module';

@Global()
@Module({
  imports: [RedisOptimizedModule],
  providers: [PrismaOptimizedService],
  exports: [PrismaOptimizedService],
})
export class PrismaOptimizedModule {}


