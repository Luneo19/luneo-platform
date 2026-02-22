/**
 * RagService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RagService } from '../rag.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { VectorService } from '@/libs/vector/vector.service';
import { LlmService } from '@/libs/llm/llm.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

const mockPrisma = {
  agent: {
    findUnique: jest.fn(),
  },
  knowledgeChunk: {
    findMany: jest.fn(),
  },
};

const mockVectorService = {
  query: jest.fn(),
};

const mockLlmService = {
  generateEmbedding: jest.fn(),
  complete: jest.fn(),
};

const mockCache = {
  getSimple: jest.fn(),
  setSimple: jest.fn(),
};

describe('RagService', () => {
  let service: RagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
        { provide: VectorService, useValue: mockVectorService },
        { provide: LlmService, useValue: mockLlmService },
        { provide: SmartCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('process', () => {
    const baseAgent = {
      id: 'agent-1',
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokensPerReply: 1000,
      systemPrompt: 'You are helpful.',
      customInstructions: null,
      tone: 'PROFESSIONAL',
      autoEscalate: false,
      confidenceThreshold: 0.7,
      agentKnowledgeBases: [] as { knowledgeBase: unknown }[],
    };

    it('should run full pipeline: embed -> vector search -> filter scores -> fetch chunks -> build context -> call LLM', async () => {
      const agentWithKbs = {
        ...baseAgent,
        agentKnowledgeBases: [
          { knowledgeBaseId: 'kb-1', knowledgeBase: { id: 'kb-1' } },
        ],
      };
      const embedding = [0.1, 0.2, 0.3];
      const vectorResults = [
        { id: 'chunk-1', score: 0.9 },
        { id: 'chunk-2', score: 0.85 },
      ];
      const chunks = [
        {
          id: 'chunk-1',
          content: 'Chunk content 1',
          document: { title: 'Doc 1', url: 'https://example.com/1' },
        },
        {
          id: 'chunk-2',
          content: 'Chunk content 2',
          document: { title: 'Doc 2', url: null },
        },
      ];
      const completion = {
        content: 'LLM response with context',
        model: 'gpt-4o-mini',
        tokensIn: 150,
        tokensOut: 60,
        costUsd: 0.001,
      };

      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.agent.findUnique.mockResolvedValue(agentWithKbs);
      mockLlmService.generateEmbedding.mockResolvedValue(embedding);
      mockVectorService.query.mockResolvedValue(vectorResults);
      mockPrisma.knowledgeChunk.findMany.mockResolvedValue(chunks);
      mockLlmService.complete.mockResolvedValue(completion);
      mockCache.setSimple.mockResolvedValue(true);

      const result = await service.process('query', 'agent-1', {
        skipCache: true,
      });

      expect(result.response).toBe('LLM response with context');
      expect(result.sources).toHaveLength(2);
      expect(result.sources[0]).toMatchObject({
        chunkId: 'chunk-1',
        content: 'Chunk content 1',
        score: 0.9,
        documentTitle: 'Doc 1',
      });
      expect(result.tokensIn).toBe(150);
      expect(result.tokensOut).toBe(60);
      expect(result.costUsd).toBe(0.001);

      expect(mockLlmService.generateEmbedding).toHaveBeenCalledWith('query');
      expect(mockVectorService.query).toHaveBeenCalledWith(
        embedding,
        expect.objectContaining({ namespace: 'kb-1' }),
      );
      expect(mockLlmService.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Doc 1'),
            }),
            expect.objectContaining({ role: 'user', content: 'query' }),
          ]),
        }),
      );
    });

    it('should return LLM response without context when no KBs attached', async () => {
      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.agent.findUnique.mockResolvedValue(baseAgent);
      mockLlmService.complete.mockResolvedValue({
        content: 'Response without RAG',
        model: 'gpt-4o-mini',
        tokensIn: 50,
        tokensOut: 20,
        costUsd: 0.0005,
      });
      mockCache.setSimple.mockResolvedValue(true);

      const result = await service.process('query', 'agent-1', {
        skipCache: true,
      });

      expect(result.response).toBe('Response without RAG');
      expect(result.sources).toEqual([]);
      expect(mockLlmService.generateEmbedding).not.toHaveBeenCalled();
      expect(mockVectorService.query).not.toHaveBeenCalled();
      expect(mockLlmService.complete).toHaveBeenCalled();
    });

    it('should still call LLM when no relevant chunks (all scores below threshold)', async () => {
      const agentWithKbs = {
        ...baseAgent,
        agentKnowledgeBases: [
          { knowledgeBaseId: 'kb-1', knowledgeBase: { id: 'kb-1' } },
        ],
      };
      const embedding = [0.1, 0.2];
      const vectorResults = [
        { id: 'chunk-1', score: 0.5 },
        { id: 'chunk-2', score: 0.3 },
      ];

      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.agent.findUnique.mockResolvedValue(agentWithKbs);
      mockLlmService.generateEmbedding.mockResolvedValue(embedding);
      mockVectorService.query.mockResolvedValue(vectorResults);
      mockLlmService.complete.mockResolvedValue({
        content: 'Fallback response',
        model: 'gpt-4o-mini',
        tokensIn: 30,
        tokensOut: 15,
        costUsd: 0.0002,
      });
      mockCache.setSimple.mockResolvedValue(true);

      const result = await service.process('query', 'agent-1', {
        skipCache: true,
        minScore: 0.7,
      });

      expect(result.response).toBe('Fallback response');
      expect(result.sources).toEqual([]);
      expect(mockPrisma.knowledgeChunk.findMany).not.toHaveBeenCalled();
      expect(mockLlmService.complete).toHaveBeenCalled();
    });

    it('should return cached result on cache hit', async () => {
      const cached = {
        response: 'Cached response',
        sources: [],
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: 1,
        model: 'gpt-4o-mini',
      };
      mockCache.getSimple.mockResolvedValue(cached);

      const result = await service.process('query', 'agent-1');

      expect(result).toEqual(cached);
      expect(mockPrisma.agent.findUnique).not.toHaveBeenCalled();
      expect(mockLlmService.complete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.agent.findUnique.mockResolvedValue(null);

      await expect(
        service.process('query', 'missing-agent', { skipCache: true }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.process('query', 'missing-agent', { skipCache: true }),
      ).rejects.toThrow(/introuvable/);
    });
  });

  describe('retrieveContext', () => {
    it('should return context string and sources array', async () => {
      const agent = {
        id: 'agent-1',
        agentKnowledgeBases: [
          { knowledgeBaseId: 'kb-1', knowledgeBase: { id: 'kb-1' } },
        ],
      };
      const embedding = [0.1, 0.2];
      const vectorResults = [{ id: 'chunk-1', score: 0.9 }];
      const chunks = [
        {
          id: 'chunk-1',
          content: 'Relevant content',
          document: { title: 'Source Doc', url: 'https://doc.com' },
        },
      ];

      mockPrisma.agent.findUnique.mockResolvedValue(agent);
      mockLlmService.generateEmbedding.mockResolvedValue(embedding);
      mockVectorService.query.mockResolvedValue(vectorResults);
      mockPrisma.knowledgeChunk.findMany.mockResolvedValue(chunks);

      const result = await service.retrieveContext('query', 'agent-1', {
        topK: 5,
        minScore: 0.7,
      });

      expect(result.context).toContain('[Source 1: Source Doc]');
      expect(result.context).toContain('Relevant content');
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0]).toMatchObject({
        chunkId: 'chunk-1',
        content: 'Relevant content',
        score: 0.9,
        documentTitle: 'Source Doc',
        sourceUrl: 'https://doc.com',
      });
    });

    it('should return empty context and sources when no KBs attached', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue({
        id: 'agent-1',
        agentKnowledgeBases: [],
      });

      const result = await service.retrieveContext('query', 'agent-1');

      expect(result).toEqual({ context: '', sources: [] });
      expect(mockLlmService.generateEmbedding).not.toHaveBeenCalled();
    });

    it('should exclude chunks below minScore (0.7)', async () => {
      const agent = {
        id: 'agent-1',
        agentKnowledgeBases: [
          { knowledgeBaseId: 'kb-1', knowledgeBase: { id: 'kb-1' } },
        ],
      };
      const embedding = [0.1];
      const vectorResults = [
        { id: 'chunk-1', score: 0.9 },
        { id: 'chunk-2', score: 0.65 },
        { id: 'chunk-3', score: 0.75 },
      ];
      const chunks = [
        { id: 'chunk-1', content: 'High', document: { title: 'A', url: null } },
        { id: 'chunk-3', content: 'Mid', document: { title: 'B', url: null } },
      ];

      mockPrisma.agent.findUnique.mockResolvedValue(agent);
      mockLlmService.generateEmbedding.mockResolvedValue(embedding);
      mockVectorService.query.mockResolvedValue(vectorResults);
      mockPrisma.knowledgeChunk.findMany.mockResolvedValue(chunks);

      const result = await service.retrieveContext('query', 'agent-1', {
        topK: 5,
        minScore: 0.7,
      });

      expect(result.sources).toHaveLength(2);
      expect(result.sources.map((s) => s.chunkId)).toEqual(['chunk-1', 'chunk-3']);
      expect(result.sources.every((s) => s.score >= 0.7)).toBe(true);
    });

    it('should format sources correctly with titles', async () => {
      const agent = {
        id: 'agent-1',
        agentKnowledgeBases: [
          { knowledgeBaseId: 'kb-1', knowledgeBase: { id: 'kb-1' } },
        ],
      };
      const embedding = [0.1];
      const vectorResults = [{ id: 'c1', score: 0.9 }];
      const chunks = [
        {
          id: 'c1',
          content: 'Content',
          document: { title: 'My Document', url: null },
        },
      ];

      mockPrisma.agent.findUnique.mockResolvedValue(agent);
      mockLlmService.generateEmbedding.mockResolvedValue(embedding);
      mockVectorService.query.mockResolvedValue(vectorResults);
      mockPrisma.knowledgeChunk.findMany.mockResolvedValue(chunks);

      const result = await service.retrieveContext('query', 'agent-1');

      expect(result.context).toMatch(/\[Source 1: My Document\]/);
      expect(result.context).toContain('Content');
      expect(result.sources[0].documentTitle).toBe('My Document');
    });
  });
});
