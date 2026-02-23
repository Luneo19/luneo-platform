import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { VectorModule } from '@/libs/vector/vector.module';
import { ChunkingModule } from '@/libs/chunking';
import { DocumentParserModule } from '@/libs/document-parser';
import { StorageModule } from '@/libs/storage/storage.module';
import { QueuesModule } from '@/libs/queues';
import { QuotasModule } from '@/modules/quotas/quotas.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeIndexingProcessor } from './knowledge-indexing.processor';

@Module({
  imports: [
    PrismaOptimizedModule,
    SmartCacheModule,
    VectorModule,
    ChunkingModule,
    DocumentParserModule,
    StorageModule,
    QueuesModule,
    QuotasModule,
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeIndexingProcessor],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
