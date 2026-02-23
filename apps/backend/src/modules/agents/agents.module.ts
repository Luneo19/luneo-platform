import { Module, forwardRef } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { CorrectionsService } from './corrections.service';
import { FlowExecutionEngine, FLOW_ORCHESTRATOR, FLOW_LLM, FLOW_KNOWLEDGE } from '@/libs/flow/flow-execution-engine';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AgentTemplatesModule } from '@/modules/agent-templates/agent-templates.module';
import { OrchestratorModule } from '@/modules/orchestrator/orchestrator.module';
import { OrchestratorService } from '@/modules/orchestrator/orchestrator.service';
import { QuotasModule } from '@/modules/quotas/quotas.module';

@Module({
  imports: [PrismaOptimizedModule, SmartCacheModule, AgentTemplatesModule, forwardRef(() => OrchestratorModule), QuotasModule],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    CorrectionsService,
    FlowExecutionEngine,
    {
      provide: FLOW_ORCHESTRATOR,
      useExisting: OrchestratorService,
    },
    { provide: FLOW_LLM, useValue: null },
    { provide: FLOW_KNOWLEDGE, useValue: null },
  ],
  exports: [AgentsService, CorrectionsService, FlowExecutionEngine],
})
export class AgentsModule {}
