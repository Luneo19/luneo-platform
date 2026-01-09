import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RailwayHealthController } from './railway-health.controller';
import { MetricsModule } from '@/libs/metrics/metrics.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisModule } from '@/libs/redis/redis.module';

@Module({
  imports: [TerminusModule, MetricsModule, PrismaModule, RedisModule],
  controllers: [HealthController, RailwayHealthController],
  exports: [],
})
export class HealthModule {}
