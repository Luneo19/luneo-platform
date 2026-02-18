/**
 * @fileoverview Module principal des Agents IA
 * @module AgentsModule
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Export des services utilisés par d'autres modules
 * - ✅ Import des dépendances nécessaires
 * - ✅ Structure NestJS standard
 */

import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

// Sub-modules
import { LunaModule } from './luna/luna.module';
import { AriaModule } from './aria/aria.module';
import { NovaModule } from './nova/nova.module';
import { LLMModule } from './llm/llm.module';
import { AgentSecurityModule } from './security/security.module';
import { PromptsModule } from './prompts/prompts.module';
import { MemoryModule } from './memory/memory.module';
import { RAGModule } from './rag/rag.module';
import { CostManagementModule } from './cost-management/cost-management.module';

// Shared services
import { AgentOrchestratorService } from './services/agent-orchestrator.service';
import { LLMRouterService } from './services/llm-router.service';
import { ConversationService } from './services/conversation.service';
import { AgentMemoryService } from './services/agent-memory.service';
import { LLMCostCalculatorService } from './services/llm-cost-calculator.service';
import { RetryService } from './services/retry.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { AgentMetricsService } from './services/agent-metrics.service';
import { IntentDetectionService } from './services/intent-detection.service';
import { ContextManagerService } from './services/context-manager.service';
import { PromptSecurityService } from './services/prompt-security.service';
import { LLMStreamService } from './services/llm-stream.service';
import { RAGService } from './services/rag.service';
import { AgentUsageGuardService } from './services/agent-usage-guard.service';

// Controllers
import { AgentsController } from './agents.controller';
import { AgentsAdminController } from './agents-admin.controller';

// Infrastructure
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AiModule } from '@/modules/ai/ai.module';
import { MetricsModule } from '@/libs/metrics/metrics.module';

// Usage Guardian & AI Monitor
import { UsageGuardianModule } from './usage-guardian/usage-guardian.module';
import { AIMonitorModule } from './ai-monitor/ai-monitor.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    AiModule,
    MetricsModule,
    LLMModule,
    AgentSecurityModule,
    PromptsModule,
    MemoryModule,
    RAGModule,
    CostManagementModule,
    UsageGuardianModule,
    AIMonitorModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
    BullModule.registerQueue({
      name: 'agent-tasks',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    forwardRef(() => LunaModule),
    forwardRef(() => AriaModule),
    forwardRef(() => NovaModule),
  ],
  controllers: [AgentsController, AgentsAdminController],
  providers: [
    AgentOrchestratorService,
    LLMRouterService,
    ConversationService,
    AgentMemoryService,
    LLMCostCalculatorService,
    RetryService,
    CircuitBreakerService,
    AgentMetricsService,
    IntentDetectionService,
    ContextManagerService,
    PromptSecurityService,
    LLMStreamService,
    RAGService,
    AgentUsageGuardService,
  ],
  exports: [
    AgentOrchestratorService,
    LLMRouterService,
    ConversationService,
    AgentMemoryService,
    LLMCostCalculatorService,
    RetryService,
    CircuitBreakerService,
    AgentMetricsService,
    IntentDetectionService,
    ContextManagerService,
    PromptSecurityService,
    LLMStreamService,
    RAGService,
    AgentUsageGuardService,
    LLMModule,
    AgentSecurityModule,
    PromptsModule,
    MemoryModule,
    RAGModule,
    CostManagementModule,
    LunaModule,
    AriaModule,
    NovaModule,
    UsageGuardianModule,
    AIMonitorModule,
  ],
})
export class AgentsModule {}
