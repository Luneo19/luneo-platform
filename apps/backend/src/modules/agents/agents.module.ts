import { Module, forwardRef } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { CorrectionsService } from './corrections.service';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AgentTemplatesModule } from '@/modules/agent-templates/agent-templates.module';
import { OrchestratorModule } from '@/modules/orchestrator/orchestrator.module';
import { QuotasModule } from '@/modules/quotas/quotas.module';

@Module({
  imports: [PrismaOptimizedModule, SmartCacheModule, AgentTemplatesModule, forwardRef(() => OrchestratorModule), QuotasModule],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    CorrectionsService,
  ],
  exports: [AgentsService, CorrectionsService],
})
export class AgentsModule {}
