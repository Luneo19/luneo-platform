import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RAGPipelineService } from './services/rag-pipeline.service';
import { EmbeddingsService } from './services/embeddings.service';
import { TextSplitterService } from './services/text-splitter.service';
import { DocumentLoaderService } from './services/document-loader.service';
import { PgVectorStore } from './stores/pgvector.store';

const services = [
  RAGPipelineService,
  EmbeddingsService,
  TextSplitterService,
  DocumentLoaderService,
  PgVectorStore,
];

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: services,
  exports: services,
})
export class RAGModule {}
