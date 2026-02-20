/**
 * @fileoverview Service RAG (Retrieval Augmented Generation)
 * @module RAGService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Recherche sémantique avec embeddings
 * - ✅ Vector store (pgvector ou Pinecone)
 * - ✅ Intégration dans prompts
 * - ✅ Types explicites
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService } from './llm-router.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Métadonnées de document avec typage strict
 */
export interface DocumentMetadata {
  category?: string;
  tags?: string[];
  slug?: string;
  source?: string;
  [key: string]: unknown; // Pour extensibilité
}

/**
 * Document RAG avec typage strict
 */
export interface Document {
  id: string;
  content: string;
  metadata?: DocumentMetadata;
  score?: number;
}

/**
 * Résultat RAG avec typage strict
 */
export interface RAGResult {
  documents: Document[];
  query: string;
  enhancedPrompt: string;
}

/**
 * Options de recherche RAG
 */
export interface RAGSearchOptions {
  limit?: number;
  threshold?: number;
  documentTypes?: string[];
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);
  private readonly openaiApiKey: string;
  private readonly useVectorStore: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly llmRouter: LLMRouterService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.openaiApiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    // Vérifier si pgvector est disponible
    this.useVectorStore = this.configService.get<boolean>('USE_VECTOR_STORE') ?? false;
  }

  /**
   * Recherche des documents pertinents pour une requête
   */
  async search(
    query: string,
    brandId: string,
    options: {
      limit?: number;
      threshold?: number;
      documentTypes?: string[];
    } = {},
  ): Promise<Document[]> {
    const limit = options.limit || 5;
    const _threshold = options.threshold || 0.7;

    // ✅ Validation des entrées
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      this.logger.warn('Invalid query provided to search');
      return [];
    }

    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to search');
      return [];
    }

    const validatedLimit = typeof options.limit === 'number' && options.limit > 0 && options.limit <= 50
      ? options.limit
      : 5;
    const validatedThreshold = typeof options.threshold === 'number' && options.threshold >= 0 && options.threshold <= 1
      ? options.threshold
      : 0.7;

    // ✅ Vérifier cache
    const cacheKey = `rag:search:${this.hashQuery(query.trim())}:${brandId.trim()}:${validatedLimit}`;
    const cached = await this.cache.getSimple<Document[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    try {
      let documents: Document[];

      if (this.useVectorStore) {
        // ✅ Utiliser vector store (pgvector)
        documents = await this.searchVectorStore(query.trim(), brandId.trim(), validatedLimit, validatedThreshold);
      } else {
        // ✅ Fallback: recherche textuelle simple
        documents = await this.searchTextual(query.trim(), brandId.trim(), validatedLimit);
      }

      // ✅ Mettre en cache (TTL: 1 heure)
      await this.cache.setSimple(cacheKey, documents, 3600);

      return documents;
    } catch (error) {
      this.logger.error(`RAG search failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      // Fallback vers recherche textuelle
      return this.searchTextual(query, brandId, limit);
    }
  }

  /**
   * Recherche avec vector store (pgvector)
   */
  private async searchVectorStore(
    query: string,
    brandId: string,
    limit: number,
    threshold: number,
  ): Promise<Document[]> {
    try {
      // Générer embedding pour la requête
      const queryEmbedding = await this.generateEmbedding(query);
      // Recherche vectorielle avec pgvector (si extension et colonne embedding disponibles)
      // NOTE: KnowledgeBaseArticle is a global knowledge base (no brandId column).
      // Articles are curated content shared across all brands.
      const results = await this.prisma.$queryRaw<Array<{
        id: string;
        content: string;
        title: string;
        metadata: unknown;
        similarity: number;
      }>>`
        SELECT 
          id,
          content,
          title,
          (category || ' ' || COALESCE(array_to_string(tags, ' '), ''))::jsonb as metadata,
          1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector) as similarity
        FROM "KnowledgeBaseArticle"
        WHERE "isPublished" = true
          AND 1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector) > ${threshold}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;
      return results.map((row) => ({
        id: row.id,
        content: `${row.title ?? ''}\n\n${row.content ?? ''}`.trim(),
        metadata: (row.metadata as DocumentMetadata) ?? undefined,
        score: row.similarity,
      }));
    } catch {
      // Fallback: simple text search with ILIKE when pgvector is not available
      // NOTE: KnowledgeBaseArticle is a global KB (no brandId column) - shared content is intentional
      const pattern = `%${query.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
      const results = await this.prisma.$queryRaw<Array<{
        id: string;
        content: string;
        title: string;
        category: string;
        tags: string[];
        slug: string;
      }>>`
        SELECT id, content, title, category, tags, slug
        FROM "KnowledgeBaseArticle"
        WHERE "isPublished" = true
          AND (content ILIKE ${pattern} OR title ILIKE ${pattern})
        ORDER BY "updatedAt" DESC
        LIMIT ${limit}
      `;
      return results.map((row) => ({
        id: row.id,
        content: `${row.title ?? ''}\n\n${row.content ?? ''}`.trim(),
        metadata: {
          category: row.category,
          tags: row.tags,
          slug: row.slug,
        },
        score: 0.8,
      }));
    }
  }

  /**
   * Recherche textuelle simple (fallback)
   */
  private async searchTextual(
    query: string,
    brandId: string,
    limit: number,
  ): Promise<Document[]> {
    // NOTE: KnowledgeBaseArticle is a global knowledge base (no brandId column).
    // Articles are curated content, not brand-specific data, so cross-brand access is intentional.
    // If brand-specific KB articles are needed in the future, add a brandId column to the model.
    const articles = await this.prisma.knowledgeBaseArticle.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: query.split(' ') } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    // ✅ Normalisation avec gardes
    return articles.map((article) => ({
      id: article.id ?? '',
      content: `${article.title ?? ''}\n\n${article.content ?? ''}`.trim(),
      metadata: {
        category: typeof article.category === 'string' ? article.category : undefined,
        tags: Array.isArray(article.tags) ? article.tags.filter((tag): tag is string => typeof tag === 'string') : undefined,
        slug: typeof article.slug === 'string' ? article.slug : undefined,
      },
      score: 0.8, // Score par défaut pour recherche textuelle
    }));
  }

  /**
   * Génère un embedding pour une requête
   */
  private async generateEmbedding(text: string): Promise<number[]> {
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
   * Enrichit un prompt avec des documents RAG
   */
  /**
   * Enrichit un prompt avec des documents RAG avec typage strict et validation
   */
  async enhancePrompt(
    originalPrompt: string,
    query: string,
    brandId: string,
    options: RAGSearchOptions = {},
  ): Promise<RAGResult> {
    // ✅ Validation des entrées
    if (!originalPrompt || typeof originalPrompt !== 'string' || originalPrompt.trim().length === 0) {
      this.logger.warn('Invalid originalPrompt provided to enhancePrompt');
      throw new BadRequestException('Original prompt is required');
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      this.logger.warn('Invalid query provided to enhancePrompt');
      throw new BadRequestException('Query is required');
    }

    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to enhancePrompt');
      throw new BadRequestException('Brand ID is required');
    }
    // Rechercher documents pertinents
    const documents = await this.search(query, brandId, options);

    // Construire le prompt enrichi
    const contextText = documents
      .map((doc, i) => `[Document ${i + 1}]\n${doc.content}`)
      .join('\n\n');

    const enhancedPrompt = `${originalPrompt}

Contexte de la base de connaissances:
${contextText}

Utilise ce contexte pour répondre de manière précise et pertinente.`;

    return {
      documents,
      query,
      enhancedPrompt,
    };
  }

  /**
   * Hash simple pour cache key
   */
  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
