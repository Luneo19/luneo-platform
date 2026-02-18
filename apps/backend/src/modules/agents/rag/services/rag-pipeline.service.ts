import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EmbeddingsService } from './embeddings.service';
import { TextSplitterService } from './text-splitter.service';
import { DocumentLoaderService, LoadedDocument } from './document-loader.service';
import { PgVectorStore, VectorSearchResult } from '../stores/pgvector.store';

export interface RAGIndexResult {
  documentId: string;
  chunks: number;
  totalTokens: number;
}

export interface RAGQueryResult {
  results: VectorSearchResult[];
  contextText: string;
  queryLatencyMs: number;
}

@Injectable()
export class RAGPipelineService {
  private readonly logger = new Logger(RAGPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
    private readonly splitter: TextSplitterService,
    private readonly loader: DocumentLoaderService,
    private readonly vectorStore: PgVectorStore,
  ) {}

  async indexDocument(
    content: string,
    options: {
      title: string;
      brandId?: string;
      source?: string;
      mimeType?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<RAGIndexResult> {
    // Step 1: Load document
    let doc: LoadedDocument;
    if (options.mimeType === 'text/markdown') {
      doc = await this.loader.loadMarkdown(content, options.title);
    } else {
      doc = await this.loader.loadText(content, options.title, options.source);
    }

    // Step 2: Split into chunks
    const chunks = this.splitter.split(doc.content);

    // Step 3: Create parent document
    const parentDoc = await this.prisma.rAGDocument.create({
      data: {
        title: options.title,
        content: doc.content,
        brandId: options.brandId,
        source: options.source || 'upload',
        mimeType: options.mimeType || 'text/plain',
        chunkIndex: 0,
        chunkTotal: chunks.length,
        metadata: { ...doc.metadata, ...options.metadata } as any,
        tokenCount: Math.ceil(doc.content.length / 4),
      },
    });

    // Step 4: Embed and store each chunk
    const embeddings = await this.embeddings.embedBatch(chunks.map((c) => c.content));

    for (let i = 0; i < chunks.length; i++) {
      const chunkDoc = await this.prisma.rAGDocument.create({
        data: {
          title: `${options.title} [${i + 1}/${chunks.length}]`,
          content: chunks[i].content,
          brandId: options.brandId,
          source: options.source,
          mimeType: options.mimeType || 'text/plain',
          parentId: parentDoc.id,
          chunkIndex: i,
          chunkTotal: chunks.length,
          embeddingModel: 'text-embedding-3-small',
          tokenCount: Math.ceil(chunks[i].content.length / 4),
          metadata: { parentDocumentId: parentDoc.id, chunkIndex: i } as any,
        },
      });

      await this.vectorStore.upsertVector(chunkDoc.id, embeddings[i]);
    }

    // Also embed the full document for direct matching
    const fullEmbedding = await this.embeddings.embed(
      doc.content.substring(0, 8000),
    );
    await this.vectorStore.upsertVector(parentDoc.id, fullEmbedding);

    this.logger.log(
      `Indexed document "${options.title}" with ${chunks.length} chunks`,
    );

    return {
      documentId: parentDoc.id,
      chunks: chunks.length,
      totalTokens: chunks.reduce((sum, c) => sum + Math.ceil(c.content.length / 4), 0),
    };
  }

  async query(
    queryText: string,
    options: {
      brandId?: string;
      agentType?: string;
      userId?: string;
      limit?: number;
      minScore?: number;
    } = {},
  ): Promise<RAGQueryResult> {
    const start = Date.now();

    // Step 1: Embed query
    const queryEmbedding = await this.embeddings.embed(queryText);

    // Step 2: Similarity search
    const results = await this.vectorStore.similaritySearch(queryEmbedding, {
      brandId: options.brandId,
      limit: options.limit || 5,
      minScore: options.minScore || 0.7,
    });

    // Step 3: Build context text
    const contextText = results
      .map((r, i) => `[Source ${i + 1}: ${r.title}]\n${r.content}`)
      .join('\n\n---\n\n');

    const queryLatencyMs = Date.now() - start;

    // Step 4: Log query
    try {
      await this.prisma.rAGQuery.create({
        data: {
          query: queryText,
          agentType: options.agentType,
          userId: options.userId,
          resultCount: results.length,
          relevanceScore: results.length > 0 ? results[0].score : null,
          latencyMs: queryLatencyMs,
          documentId: results.length > 0 ? results[0].id : null,
        },
      });
    } catch {
      // Non-critical logging
    }

    return { results, contextText, queryLatencyMs };
  }

  async deleteDocument(documentId: string): Promise<void> {
    // Delete all chunks
    await this.prisma.rAGDocument.deleteMany({
      where: { parentId: documentId },
    });
    // Delete parent
    await this.prisma.rAGDocument.delete({
      where: { id: documentId },
    });
  }
}
