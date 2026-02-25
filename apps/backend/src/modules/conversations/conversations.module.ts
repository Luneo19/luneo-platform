import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AgentAnalyticsModule } from '@/modules/agent-analytics/agent-analytics.module';
import { EmailModule } from '@/modules/email/email.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { HandoffService } from './handoff.service';

@Module({
  imports: [PrismaOptimizedModule, SmartCacheModule, AgentAnalyticsModule, EmailModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, HandoffService],
  exports: [ConversationsService, HandoffService],
})
export class ConversationsModule {}
