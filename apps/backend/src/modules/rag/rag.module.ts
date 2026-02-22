import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { VectorModule } from '@/libs/vector/vector.module';
import { LlmModule } from '@/libs/llm/llm.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { RagService } from './rag.service';

@Module({
  imports: [PrismaOptimizedModule, VectorModule, LlmModule, SmartCacheModule],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
