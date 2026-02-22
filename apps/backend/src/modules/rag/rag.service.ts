import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { VectorService } from '@/libs/vector/vector.service';
import { LlmService } from '@/libs/llm/llm.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

export interface RagSource {
  chunkId: string;
  content: string;
  score: number;
  documentTitle: string;
  sourceUrl?: string;
}

export interface RagProcessResult {
  response: string;
  sources: RagSource[];
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  model: string;
}

export interface RagOptions {
  topK?: number;
  minScore?: number;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  skipCache?: boolean;
}

const RAG_CACHE_TTL = 600; // 10 minutes
const RAG_CACHE_TYPE = 'api';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly vectorService: VectorService,
    private readonly llmService: LlmService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Retrieve context and sources only (no LLM call). Used by Orchestrator for multi-turn conversations.
   */
  async retrieveContext(
    query: string,
    agentId: string,
    options?: { topK?: number; minScore?: number },
  ): Promise<{ context: string; sources: RagSource[] }> {
    const topK = options?.topK ?? 5;
    const minScore = options?.minScore ?? 0.7;

    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        agentKnowledgeBases: {
          include: { knowledgeBase: true },
          orderBy: { priority: 'asc' },
          where: { knowledgeBase: { deletedAt: null } },
        },
      },
    });

    if (!agent || agent.agentKnowledgeBases.length === 0) {
      return { context: '', sources: [] };
    }

    const kbIds = agent.agentKnowledgeBases.map((akb) => akb.knowledgeBaseId);
    const queryEmbedding = await this.llmService.generateEmbedding(query);
    const searchResults = await this.searchAcrossKnowledgeBases(
      queryEmbedding,
      kbIds,
      topK * 2,
    );

    const relevantResults = searchResults
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (relevantResults.length === 0) {
      return { context: '', sources: [] };
    }

    const chunkIds = relevantResults.map((r) => r.id);
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { id: { in: chunkIds } },
      include: {
        document: {
          select: { title: true, url: true },
        },
      },
    });

    const sources: RagSource[] = relevantResults.map((result) => {
      const chunk = chunks.find((c) => c.id === result.id);
      return {
        chunkId: result.id,
        content: chunk?.content ?? '',
        score: result.score,
        documentTitle: chunk?.document?.title ?? 'Unknown',
        sourceUrl: chunk?.document?.url ?? undefined,
      };
    });

    const context = sources
      .map((s, i) => `[Source ${i + 1}: ${s.documentTitle}]\n${s.content}`)
      .join('\n\n');

    return { context, sources };
  }

  async process(
    query: string,
    agentId: string,
    options?: RagOptions,
  ): Promise<RagProcessResult> {
    const topK = options?.topK ?? 5;
    const minScore = options?.minScore ?? 0.7;
    const skipCache = options?.skipCache ?? false;

    const cacheKey = this.buildCacheKey(agentId, query, { topK, minScore });

    if (!skipCache) {
      const cached = await this.cache.getSimple<RagProcessResult>(cacheKey);
      if (cached) {
        this.logger.debug(`RAG cache hit for agent ${agentId}`);
        return cached;
      }
    }

    const result = await this.processInternal(query, agentId, options);
    await this.cache.setSimple(cacheKey, result, RAG_CACHE_TTL);
    return result;
  }

  private async processInternal(
    query: string,
    agentId: string,
    options?: RagOptions,
  ): Promise<RagProcessResult> {
    const startTime = Date.now();
    const topK = options?.topK ?? 5;
    const minScore = options?.minScore ?? 0.7;

    // 1. Load agent with KB associations
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        agentKnowledgeBases: {
          include: { knowledgeBase: true },
          orderBy: { priority: 'asc' },
          where: { knowledgeBase: { deletedAt: null } },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent introuvable');
    }

    const kbIds = agent.agentKnowledgeBases.map((akb) => akb.knowledgeBaseId);

    if (kbIds.length === 0) {
      this.logger.warn(`Agent ${agentId} has no knowledge bases attached`);
      return this.processWithoutRag(query, agent, options, startTime);
    }

    // 2. Generate embedding for query
    const queryEmbedding = await this.llmService.generateEmbedding(query);

    // 3. Search across all agent's knowledge bases (namespace = kbId per KB)
    const searchResults = await this.searchAcrossKnowledgeBases(
      queryEmbedding,
      kbIds,
      topK * 2,
    );

    // 4. Filter and rerank by relevance score
    const relevantResults = searchResults
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (relevantResults.length === 0) {
      this.logger.debug(`No relevant chunks found for query (minScore=${minScore})`);
      return this.processWithoutRag(query, agent, options, startTime);
    }

    // 5. Fetch full chunk content from DB
    const chunkIds = relevantResults.map((r) => r.id);
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { id: { in: chunkIds } },
      include: {
        document: {
          select: {
            title: true,
            url: true,
            source: { select: { name: true } },
          },
        },
      },
    });

    // 6. Build sources array (reranked by score)
    const sources: RagSource[] = relevantResults.map((result) => {
      const chunk = chunks.find((c) => c.id === result.id);
      return {
        chunkId: result.id,
        content: chunk?.content ?? '',
        score: result.score,
        documentTitle: chunk?.document?.title ?? 'Unknown',
        sourceUrl: chunk?.document?.url ?? undefined,
      };
    });

    // 7. Build augmented prompt
    const contextText = sources
      .map((s, i) => `[Source ${i + 1}: ${s.documentTitle}]\n${s.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = this.buildSystemPrompt(agent, contextText);

    // 8. Call LLM
    const completion = await this.llmService.complete({
      model: options?.model ?? agent.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: options?.temperature ?? agent.temperature,
      maxTokens: options?.maxTokens ?? agent.maxTokensPerReply,
    });

    return {
      response: completion.content,
      sources,
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      costUsd: completion.costUsd ?? 0,
      latencyMs: Date.now() - startTime,
      model: completion.model,
    };
  }

  private async searchAcrossKnowledgeBases(
    queryEmbedding: number[],
    kbIds: string[],
    topKPerKb: number,
  ): Promise<Array<{ id: string; score: number }>> {
    const allResults: Array<{ id: string; score: number }> = [];

    for (const kbId of kbIds) {
      try {
        const results = await this.vectorService.query(queryEmbedding, {
          topK: topKPerKb,
          namespace: kbId,
        });
        allResults.push(
          ...results.map((r) => ({ id: r.id, score: r.score ?? 0 })),
        );
      } catch (err) {
        this.logger.warn(
          `Vector search failed for KB ${kbId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return allResults;
  }

  private async processWithoutRag(
    query: string,
    agent: { systemPrompt?: string | null; customInstructions?: string | null; model: string; temperature: number; maxTokensPerReply: number },
    options: RagOptions | undefined,
    startTime: number,
  ): Promise<RagProcessResult> {
    const systemPrompt = this.buildSystemPrompt(agent, '');
    const completion = await this.llmService.complete({
      model: options?.model ?? agent.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: options?.temperature ?? agent.temperature,
      maxTokens: options?.maxTokens ?? agent.maxTokensPerReply,
    });

    return {
      response: completion.content,
      sources: [],
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      costUsd: completion.costUsd ?? 0,
      latencyMs: Date.now() - startTime,
      model: completion.model,
    };
  }

  private buildSystemPrompt(
    agent: {
      systemPrompt?: string | null;
      customInstructions?: string | null;
      tone?: string | null;
      autoEscalate?: boolean;
      confidenceThreshold?: number;
    },
    context: string,
  ): string {
    const parts: string[] = [];

    if (agent.systemPrompt) {
      parts.push(agent.systemPrompt);
    }

    if (agent.customInstructions) {
      parts.push(
        `\n\nInstructions supplémentaires:\n${agent.customInstructions}`,
      );
    }

    if (context) {
      parts.push(
        `\n\nBase de connaissances (utilise ces informations pour répondre):\n${context}`,
      );
    }

    parts.push(
      `\n\nRègles:\n- Réponds dans la langue du message\n- Cite tes sources quand possible\n- Si tu ne sais pas, dis-le honnêtement\n- Sois ${agent.tone?.toLowerCase() ?? 'professionnel'}`,
    );

    if (agent.autoEscalate) {
      const threshold = ((agent.confidenceThreshold ?? 0.7) * 100).toFixed(0);
      parts.push(
        `\n- Si tu n'es pas confiant à ${threshold}%, propose d'escalader vers un humain`,
      );
    }

    return parts.join('');
  }

  private buildCacheKey(
    agentId: string,
    query: string,
    options: { topK: number; minScore: number },
  ): string {
    const payload = `${agentId}:${query}:${options.topK}:${options.minScore}`;
    const hash = createHash('sha256').update(payload).digest('hex').slice(0, 24);
    return `rag:${agentId}:${hash}`;
  }

  /**
   * Invalide le cache RAG pour un agent (ex: après mise à jour de la KB).
   * Note: invalidation par pattern requiert Redis SCAN - le cache expire naturellement après TTL.
   */
  async invalidateCacheForAgent(_agentId: string): Promise<void> {
    this.logger.debug('RAG cache invalidation requested (TTL-based expiry in use)');
  }
}
