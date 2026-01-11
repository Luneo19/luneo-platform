/**
 * @fileoverview Service Vector Store avec pgvector
 * @module VectorStoreService
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly openaiApiKey: string;
  private readonly useVectorStore: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.openaiApiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    const useVectorStoreEnv = this.configService.get<string>('USE_VECTOR_STORE');
    this.useVectorStore = useVectorStoreEnv === 'true' || useVectorStoreEnv === '1';
  }

  /**
   * Génère un embedding pour un texte
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/embeddings',
          {
            model: 'text-embedding-ada-002',
            input: text,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data.data[0].embedding;
    } catch (error) {
      this.logger.error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Recherche vectorielle avec pgvector
   */
  async vectorSearch(
    queryEmbedding: number[],
    brandId: string,
    limit: number = 5,
    threshold: number = 0.7,
  ): Promise<Array<{
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    similarity: number;
  }>> {
    if (!this.useVectorStore) {
      this.logger.warn('Vector store not enabled');
      return [];
    }

    try {
      // Convertir embedding en format PostgreSQL
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      const results = await this.prisma.$queryRaw<Array<{
        id: string;
        content: string;
        metadata: unknown;
        similarity: number;
      }>>`
        SELECT 
          id,
          content,
          metadata,
          1 - (embedding <=> ${embeddingStr}::vector) as similarity
        FROM "KnowledgeBaseArticle"
        WHERE is_published = true
          AND 1 - (embedding <=> ${embeddingStr}::vector) > ${threshold}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;

      return results.map((r) => ({
        id: r.id,
        content: r.content,
        metadata: (r.metadata || {}) as Record<string, unknown>,
        similarity: r.similarity,
      }));
    } catch (error) {
      this.logger.error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      // Fallback vers recherche textuelle
      return [];
    }
  }

  /**
   * Indexe un document avec embedding
   */
  async indexDocument(
    documentId: string,
    content: string,
  ): Promise<void> {
    if (!this.useVectorStore) {
      return;
    }

    try {
      const embedding = await this.generateEmbedding(content);

      // Mettre à jour avec embedding
      await this.prisma.$executeRaw`
        UPDATE "KnowledgeBaseArticle"
        SET embedding = ${embedding}::vector
        WHERE id = ${documentId}
      `;

      this.logger.log(`Document ${documentId} indexed with vector`);
    } catch (error) {
      this.logger.error(`Indexing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Vérifie si pgvector est disponible
   */
  async checkVectorStoreAvailable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1::vector`;
      return true;
    } catch {
      return false;
    }
  }
}
