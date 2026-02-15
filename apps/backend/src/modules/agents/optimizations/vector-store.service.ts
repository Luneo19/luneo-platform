/**
 * @fileoverview Service Vector Store avec pgvector
 * @module VectorStoreService
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// OpenAI text-embedding-ada-002 dimension
const EMBEDDING_DIMENSION = 1536;

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
   * SEC-13: Valide le format d'un embedding
   * @param embedding - Tableau de nombres à valider
   * @throws BadRequestException si le format est invalide
   */
  private validateEmbedding(embedding: unknown): asserts embedding is number[] {
    if (!Array.isArray(embedding)) {
      throw new BadRequestException('Embedding must be an array');
    }

    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new BadRequestException(
        `Embedding must have exactly ${EMBEDDING_DIMENSION} dimensions, got ${embedding.length}`,
      );
    }

    for (let i = 0; i < embedding.length; i++) {
      const value = embedding[i];
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new BadRequestException(
          `Embedding value at index ${i} must be a finite number`,
        );
      }
      // text-embedding-ada-002 values are typically in range [-1, 1]
      if (value < -10 || value > 10) {
        throw new BadRequestException(
          `Embedding value at index ${i} out of expected range: ${value}`,
        );
      }
    }
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
   * SEC-13: Validation du format embedding et filtrage par brandId
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

    // SEC-13: Valider le format de l'embedding
    this.validateEmbedding(queryEmbedding);

    // Valider et nettoyer brandId
    if (!brandId || typeof brandId !== 'string') {
      throw new BadRequestException('brandId is required');
    }
    const cleanBrandId = brandId.trim();

    // Valider les paramètres numériques
    const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
    const safeThreshold = Math.min(Math.max(0, threshold), 1);

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
        WHERE "isPublished" = true
          AND "brandId" = ${cleanBrandId}
          AND 1 - (embedding <=> ${embeddingStr}::vector) > ${safeThreshold}
        ORDER BY similarity DESC
        LIMIT ${safeLimit}
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
   * SEC-13: Validation de l'embedding généré avant insertion
   */
  async indexDocument(
    documentId: string,
    content: string,
  ): Promise<void> {
    if (!this.useVectorStore) {
      return;
    }

    // Valider documentId
    if (!documentId || typeof documentId !== 'string') {
      throw new BadRequestException('documentId is required');
    }
    const cleanDocumentId = documentId.trim();

    try {
      const embedding = await this.generateEmbedding(content);

      // SEC-13: Valider l'embedding généré avant insertion
      this.validateEmbedding(embedding);

      // Convertir embedding en format PostgreSQL
      const embeddingStr = `[${embedding.join(',')}]`;

      // Mettre à jour avec embedding
      await this.prisma.$executeRaw`
        UPDATE "KnowledgeBaseArticle"
        SET embedding = ${embeddingStr}::vector
        WHERE id = ${cleanDocumentId}
      `;

      this.logger.log(`Document ${cleanDocumentId} indexed with vector`);
    } catch (error) {
      this.logger.error(`Indexing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error; // Re-throw pour que l'appelant puisse gérer
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
