import { Module } from '@nestjs/common';
import { AgentAnalyticsController } from './agent-analytics.controller';
import { AgentAnalyticsService } from './agent-analytics.service';

@Module({
  controllers: [AgentAnalyticsController],
  providers: [AgentAnalyticsService],
  exports: [AgentAnalyticsService],
})
export class AgentAnalyticsModule {}
