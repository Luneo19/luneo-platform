/**
 * Tests unitaires pour RAGService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RAGService } from '../rag.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService } from '../llm-router.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

describe('RAGService', () => {
  let service: RAGService;
  let prisma: jest.Mocked<PrismaService>;
  let cache: jest.Mocked<SmartCacheService>;

  beforeEach(async () => {
    const mockPrisma = {
      knowledgeBaseArticle: {
        findMany: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const mockLlmRouter = {
      chat: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
      getOrThrow: jest.fn().mockReturnValue('test-api-key'),
    };

    const mockHttpService = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RAGService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SmartCacheService,
          useValue: mockCache,
        },
        {
          provide: LLMRouterService,
          useValue: mockLlmRouter,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<RAGService>(RAGService);
    prisma = module.get(PrismaService);
    cache = module.get(SmartCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return cached results if available', async () => {
      const cachedDocs = [
        {
          id: '1',
          content: 'Cached document',
          metadata: {},
          score: 0.9,
        },
      ];

      cache.get.mockResolvedValue(cachedDocs);

      const result = await service.search('test query', 'brand-id');

      expect(result).toEqual(cachedDocs);
      expect(prisma.knowledgeBaseArticle.findMany).not.toHaveBeenCalled();
    });

    it('should search articles if not cached', async () => {
      cache.get.mockResolvedValue(null);
      prisma.knowledgeBaseArticle.findMany.mockResolvedValue([
        {
          id: '1',
          title: 'Test Article',
          content: 'Test content',
          category: 'test',
          tags: ['test'],
          slug: 'test-article',
          isPublished: true,
          views: 0,
          helpful: 0,
          notHelpful: 0,
          authorId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.search('test query', 'brand-id');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].content).toContain('Test Article');
      expect(cache.set).toHaveBeenCalled();
    });
  });

  describe('enhancePrompt', () => {
    it('should enhance prompt with RAG documents', async () => {
      prisma.knowledgeBaseArticle.findMany.mockResolvedValue([
        {
          id: '1',
          title: 'Test Article',
          content: 'Test content',
          category: 'test',
          tags: ['test'],
          slug: 'test-article',
          isPublished: true,
          views: 0,
          helpful: 0,
          notHelpful: 0,
          authorId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.enhancePrompt(
        'Original prompt',
        'test query',
        'brand-id',
      );

      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.enhancedPrompt).toContain('Original prompt');
      expect(result.enhancedPrompt).toContain('Test Article');
    });
  });
});
