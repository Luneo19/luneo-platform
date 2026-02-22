import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { AgentAnalyticsController } from './agent-analytics.controller';
import { AgentAnalyticsService } from './agent-analytics.service';
import { InsightsService } from './services/insights.service';

@Module({
  imports: [PrismaOptimizedModule, RedisOptimizedModule],
  controllers: [AgentAnalyticsController],
  providers: [AgentAnalyticsService, InsightsService],
  exports: [AgentAnalyticsService, InsightsService],
})
export class AgentAnalyticsModule {}
