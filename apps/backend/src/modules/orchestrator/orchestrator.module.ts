import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { RagModule } from '@/modules/rag/rag.module';
import { ToolRegistryService } from './tools/tool-registry.service';

@Module({
  imports: [RagModule],
  providers: [OrchestratorService, ToolRegistryService],
  exports: [OrchestratorService, ToolRegistryService],
})
export class OrchestratorModule {}
