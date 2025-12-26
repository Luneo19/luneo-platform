import { Module } from '@nestjs/common';
import { AIOrchestratorService } from './ai-orchestrator.service';
import { OpenAIProvider } from './providers/openai.provider';
import { ReplicateSDXLProvider } from './providers/replicate-sdxl.provider';
import { BudgetModule } from '@/libs/budgets/budget.module';
import { PromptTemplatesModule } from './prompt-templates.module';
import { DesignDNAModule } from './design-dna.module';

@Module({
  imports: [BudgetModule, PromptTemplatesModule, DesignDNAModule],
  providers: [AIOrchestratorService, OpenAIProvider, ReplicateSDXLProvider],
  exports: [AIOrchestratorService, PromptTemplatesModule, DesignDNAModule],
})
export class AIOrchestratorModule {}





















