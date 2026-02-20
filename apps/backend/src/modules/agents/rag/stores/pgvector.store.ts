import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface VectorSearchResult {
  id: string;
  content: string;
  title: string;
  score: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class PgVectorStore implements OnModuleInit {
  private readonly logger = new Logger(PgVectorStore.name);
  private pgvectorEnabled = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      const extensions = await this.prisma.$queryRawUnsafe<{ name: string }[]>(
        `SELECT name FROM pg_available_extensions WHERE name = 'vector'`,
      );
      if (!extensions || extensions.length === 0) {
        this.logger.debug('pgvector extension not available on this PostgreSQL installation. Using JSON-based similarity search.');
        return;
      }

      await this.prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
      this.pgvectorEnabled = true;
      this.logger.log('pgvector extension enabled');

      // Create the vector column if it doesn't exist (uses raw SQL since Prisma doesn't support vector type natively)
      await this.prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'RAGDocument' AND column_name = 'embedding_vector'
          ) THEN
            ALTER TABLE "RAGDocument" ADD COLUMN embedding_vector vector(1536);
          END IF;
        END $$;
      `);

      // Create an index for fast similarity search
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS rag_document_embedding_idx
        ON "RAGDocument" USING ivfflat (embedding_vector vector_cosine_ops)
        WITH (lists = 100);
      `).catch(() => {
        // Index creation may fail if not enough rows; that's fine
        this.logger.debug('IVFFlat index creation deferred (needs more data)');
      });
    } catch (error) {
      this.logger.warn(`pgvector not available: ${error}. Falling back to JSON-based similarity search.`);
    }
  }

  async upsertVector(documentId: string, embedding: number[]): Promise<void> {
    if (this.pgvectorEnabled) {
      const vectorStr = `[${embedding.join(',')}]`;
      await this.prisma.$executeRawUnsafe(
        `UPDATE "RAGDocument" SET embedding_vector = $1::vector WHERE id = $2`,
        vectorStr,
        documentId,
      );
    }

    // Always store as JSON for compatibility
    await this.prisma.rAGDocument.update({
      where: { id: documentId },
      data: { embedding: embedding as any },
    });
  }

  async similaritySearch(
    queryEmbedding: number[],
    options: {
      brandId?: string;
      limit?: number;
      minScore?: number;
    } = {},
  ): Promise<VectorSearchResult[]> {
    const limit = options.limit || 5;
    const minScore = options.minScore || 0.7;

    if (this.pgvectorEnabled) {
      return this.pgvectorSearch(queryEmbedding, options.brandId, limit, minScore);
    }
    return this.jsonFallbackSearch(queryEmbedding, options.brandId, limit, minScore);
  }

  private async pgvectorSearch(
    queryEmbedding: number[],
    brandId: string | undefined,
    limit: number,
    minScore: number,
  ): Promise<VectorSearchResult[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    const brandFilter = brandId
      ? `AND ("brandId" = '${brandId}' OR "brandId" IS NULL)`
      : '';

    const results = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; content: string; title: string; score: number; metadata: any }>
    >(
      `SELECT id, content, title, metadata,
              1 - (embedding_vector <=> $1::vector) as score
       FROM "RAGDocument"
       WHERE "isActive" = true
         AND embedding_vector IS NOT NULL
         ${brandFilter}
       ORDER BY embedding_vector <=> $1::vector
       LIMIT $2`,
      vectorStr,
      limit,
    );

    return results
      .filter((r) => r.score >= minScore)
      .map((r) => ({
        id: r.id,
        content: r.content,
        title: r.title,
        score: r.score,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {},
      }));
  }

  private async jsonFallbackSearch(
    queryEmbedding: number[],
    brandId: string | undefined,
    limit: number,
    minScore: number,
  ): Promise<VectorSearchResult[]> {
    const where: any = { isActive: true, embedding: { not: null } };
    if (brandId) {
      where.OR = [{ brandId }, { brandId: null }];
    }

    const documents = await this.prisma.rAGDocument.findMany({
      where,
      take: 100, // Fetch more, then sort by similarity in memory
    });

    const scored = documents
      .map((doc) => {
        const docEmbedding = doc.embedding as number[] | null;
        if (!docEmbedding || !Array.isArray(docEmbedding)) return null;
        const score = this.cosineSimilarity(queryEmbedding, docEmbedding);
        return {
          id: doc.id,
          content: doc.content,
          title: doc.title,
          score,
          metadata: (doc.metadata || {}) as Record<string, unknown>,
        };
      })
      .filter((r): r is VectorSearchResult => r !== null && r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }
}
