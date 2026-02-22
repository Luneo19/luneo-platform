import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { RagModule } from '@/modules/rag/rag.module';
import { ShopifyOrderTool } from './tools/shopify-order.tool';
import { ToolRegistryService } from './tools/tool-registry.service';
import { ShopifyModule } from '@/modules/integrations/shopify/shopify.module';

@Module({
  imports: [RagModule, ShopifyModule],
  providers: [OrchestratorService, ShopifyOrderTool, ToolRegistryService],
  exports: [OrchestratorService, ToolRegistryService],
})
export class OrchestratorModule {}
