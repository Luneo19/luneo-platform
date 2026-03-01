import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { QueuesModule } from '@/libs/queues';
import { AgentAnalyticsModule } from '@/modules/agent-analytics/agent-analytics.module';
import { EmailModule } from '@/modules/email/email.module';
import { LearningModule } from '@/modules/learning/learning.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { HandoffService } from './handoff.service';
import { SlaService } from './sla.service';
import { InboxCollaborationService } from './inbox-collaboration.service';
import { ConversationsGateway } from './conversations.gateway';

@Module({
  imports: [PrismaOptimizedModule, SmartCacheModule, QueuesModule, AgentAnalyticsModule, EmailModule, LearningModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    HandoffService,
    SlaService,
    InboxCollaborationService,
    ConversationsGateway,
  ],
  exports: [
    ConversationsService,
    HandoffService,
    SlaService,
    InboxCollaborationService,
    ConversationsGateway,
  ],
})
export class ConversationsModule {}
