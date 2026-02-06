import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RailwayHealthController } from './railway-health.controller';
import { MetricsModule } from '@/libs/metrics/metrics.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { CloudinaryModule } from '@/libs/storage/cloudinary.module';

@Module({
  imports: [
    TerminusModule, 
    MetricsModule, 
    PrismaModule, 
    RedisOptimizedModule,
    CloudinaryModule, // HEALTH-01: Health check Cloudinary
  ],
  controllers: [HealthController, RailwayHealthController],
  exports: [],
})
export class HealthModule {}
