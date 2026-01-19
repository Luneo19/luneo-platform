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
    AiModule, // Pour AiService.recordAICost()
    MetricsModule, // Pour PrometheusService
    UsageGuardianModule, // Usage Guardian
    AIMonitorModule, // AI Monitor
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
    // Sub-modules - utiliser forwardRef pour éviter dépendance circulaire
    forwardRef(() => LunaModule),
    forwardRef(() => AriaModule),
    forwardRef(() => NovaModule),
  ],
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
    // ✅ RÈGLE: Exporter tous les services utilisés ailleurs
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
    // Sub-modules exports
    LunaModule,
    AriaModule,
    NovaModule,
    // Usage Guardian & AI Monitor exports
    UsageGuardianModule,
    AIMonitorModule,
  ],
})
export class AgentsModule {}
