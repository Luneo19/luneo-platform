import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PrometheusService } from './prometheus.service';
import { PrometheusController } from './prometheus.controller';
import { FallbackLLMService } from '../../services/fallback-llm.service';
import { PromptSecurityService } from '../../services/prompt-security.service';
import { TicketContextService } from '../../services/ticket-context.service';
import { KnowledgeBaseAIService } from '../../services/knowledge-base-ai.service';
import { TicketReviewService } from '../../services/ticket-review.service';
import { TicketRoutingService } from '../../services/ticket-routing.service';
import { SLAEngineService } from '../../services/sla-engine.service';
import { AuditTrailService } from '../../services/audit-trail.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PrometheusController],
  providers: [
    PrometheusService,
    FallbackLLMService,
    PromptSecurityService,
    TicketContextService,
    KnowledgeBaseAIService,
    TicketReviewService,
    TicketRoutingService,
    SLAEngineService,
    AuditTrailService,
  ],
  exports: [
    PrometheusService,
    TicketReviewService,
    TicketRoutingService,
    SLAEngineService,
    AuditTrailService,
    FallbackLLMService,
    PromptSecurityService,
  ],
})
export class PrometheusModule {}
