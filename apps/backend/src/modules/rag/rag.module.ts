import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { VectorModule } from '@/libs/vector/vector.module';
import { LlmModule } from '@/libs/llm/llm.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { RagService } from './rag.service';
import { QueryExpanderService } from './query-expander.service';
import { RerankerService } from './reranker.service';

@Module({
  imports: [PrismaOptimizedModule, VectorModule, LlmModule, SmartCacheModule],
  providers: [RagService, QueryExpanderService, RerankerService],
  exports: [RagService],
})
export class RagModule {}
