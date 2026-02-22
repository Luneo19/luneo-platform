// @ts-nocheck
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone, Index as PineconeIndex } from '@pinecone-database/pinecone';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import {
  VectorProvider,
  VectorRecord,
  QueryResult,
  UpsertOptions,
  QueryOptions,
  DeleteOptions,
} from './vector.interface';

@Injectable()
export class VectorService implements VectorProvider, OnModuleInit {
  private readonly logger = new Logger(VectorService.name);
  private pinecone: Pinecone | null = null;
  private pineconeIndex: PineconeIndex | null = null;
  private usePinecone = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaOptimizedService,
  ) {}

  async onModuleInit(): Promise<void> {
    const apiKey = this.config.get<string>('PINECONE_API_KEY');
    const indexName = this.config.get<string>('PINECONE_INDEX');

    if (apiKey && indexName) {
      try {
        this.pinecone = new Pinecone({ apiKey });
        this.pineconeIndex = this.pinecone.index(indexName);
        this.usePinecone = true;
        this.logger.log('Pinecone vector provider initialized');
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Pinecone init failed, falling back to pgvector: ${msg}`);
      }
    } else {
      this.logger.log('No Pinecone credentials — using pgvector fallback');
    }

    await this.ensurePgvectorExtension();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async upsert(records: VectorRecord[], options?: UpsertOptions): Promise<void> {
    if (this.usePinecone) {
      return this.pineconeUpsert(records, options);
    }
    return this.pgvectorUpsert(records, options);
  }

  async query(vector: number[], options?: QueryOptions): Promise<QueryResult[]> {
    if (this.usePinecone) {
      return this.pineconeQuery(vector, options);
    }
    return this.pgvectorQuery(vector, options);
  }

  async delete(ids: string[], options?: DeleteOptions): Promise<void> {
    if (this.usePinecone) {
      return this.pineconeDelete(ids, options);
    }
    return this.pgvectorDelete(ids, options);
  }

  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      if (this.usePinecone && this.pineconeIndex) {
        await this.pineconeIndex.describeIndexStats();
      } else {
        await this.prisma.$queryRawUnsafe('SELECT 1');
      }
      return { status: 'healthy', latency: Date.now() - start };
    } catch {
      return { status: 'unhealthy', latency: Date.now() - start };
    }
  }

  // ---------------------------------------------------------------------------
  // Pinecone implementation
  // ---------------------------------------------------------------------------

  private async pineconeUpsert(records: VectorRecord[], options?: UpsertOptions): Promise<void> {
    const index = this.resolveIndex(options?.namespace);
    const vectors = records.map((r) => ({
      id: r.id,
      values: r.values,
      metadata: r.metadata as Record<string, string>,
    }));

    const BATCH_SIZE = 100;
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      await index.upsert(vectors.slice(i, i + BATCH_SIZE));
    }
    this.logger.debug(`Pinecone upsert: ${records.length} vectors`);
  }

  private async pineconeQuery(vector: number[], options?: QueryOptions): Promise<QueryResult[]> {
    const index = this.resolveIndex(options?.namespace);
    const response = await index.query({
      vector,
      topK: options?.topK ?? 10,
      filter: options?.filter as Record<string, string> | undefined,
      includeMetadata: options?.includeMetadata ?? true,
    });

    return (response.matches ?? []).map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: (m.metadata as Record<string, unknown>) ?? {},
    }));
  }

  private async pineconeDelete(ids: string[], options?: DeleteOptions): Promise<void> {
    const index = this.resolveIndex(options?.namespace);
    await index.deleteMany(ids);
    this.logger.debug(`Pinecone delete: ${ids.length} vectors`);
  }

  private resolveIndex(namespace?: string): PineconeIndex {
    if (!this.pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }
    return namespace ? this.pineconeIndex.namespace(namespace) : this.pineconeIndex;
  }

  // ---------------------------------------------------------------------------
  // pgvector implementation (fallback)
  // ---------------------------------------------------------------------------

  private async ensurePgvectorExtension(): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS vector_store (
          id         TEXT PRIMARY KEY,
          namespace  TEXT NOT NULL DEFAULT 'default',
          embedding  vector,
          metadata   JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_vector_store_namespace
        ON vector_store (namespace)
      `);
      this.logger.debug('pgvector extension and table ensured');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`pgvector setup skipped: ${msg}`);
    }
  }

  private async pgvectorUpsert(records: VectorRecord[], options?: UpsertOptions): Promise<void> {
    const ns = options?.namespace ?? 'default';

    for (const record of records) {
      const vec = `[${record.values.join(',')}]`;
      const meta = JSON.stringify(record.metadata ?? {});
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO vector_store (id, namespace, embedding, metadata, updated_at)
         VALUES ($1, $2, $3::vector, $4::jsonb, now())
         ON CONFLICT (id) DO UPDATE
           SET embedding  = EXCLUDED.embedding,
               metadata   = EXCLUDED.metadata,
               namespace  = EXCLUDED.namespace,
               updated_at = now()`,
        record.id,
        ns,
        vec,
        meta,
      );
    }
    this.logger.debug(`pgvector upsert: ${records.length} vectors`);
  }

  private async pgvectorQuery(vector: number[], options?: QueryOptions): Promise<QueryResult[]> {
    const ns = options?.namespace ?? 'default';
    const topK = options?.topK ?? 10;
    const vec = `[${vector.join(',')}]`;

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; score: number; metadata: Record<string, unknown> }>
    >(
      `SELECT id,
              1 - (embedding <=> $1::vector) AS score,
              metadata
       FROM vector_store
       WHERE namespace = $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      vec,
      ns,
      topK,
    );

    return rows.map((r) => ({
      id: r.id,
      score: Number(r.score),
      metadata: r.metadata,
    }));
  }

  private async pgvectorDelete(ids: string[], options?: DeleteOptions): Promise<void> {
    if (ids.length === 0) return;

    const ns = options?.namespace ?? 'default';
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM vector_store WHERE namespace = $1 AND id IN (${placeholders})`,
      ns,
      ...ids,
    );
    this.logger.debug(`pgvector delete: ${ids.length} vectors`);
  }
}
