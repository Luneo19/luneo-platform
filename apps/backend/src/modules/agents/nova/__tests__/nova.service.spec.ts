/**
 * @fileoverview Tests unitaires pour NovaService
 * @module NovaServiceSpec
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Tests isolés avec mocks
 * - ✅ Couverture des cas principaux (FAQ, ticket, escalade)
 * - ✅ Descriptions claires
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { NovaService, NovaIntentType } from '../nova.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService } from '../../services/llm-router.service';
import { IntentDetectionService } from '../../services/intent-detection.service';
import { AgentUsageGuardService } from '../../services/agent-usage-guard.service';

// ============================================================================
// MOCKS
// ============================================================================

const mockPrismaService = {
  knowledgeBaseArticle: {
    findMany: jest.fn(),
  },
  ticket: {
    create: jest.fn(),
  },
  ticketMessage: {
    create: jest.fn(),
  },
  ticketActivity: {
    create: jest.fn(),
  },
  brand: {
    findUnique: jest.fn(),
  },
};

const mockCacheService = {
  getOrSet: jest.fn((key: string, fn: () => Promise<unknown>) => fn()),
};

const mockLLMRouterService = {
  chat: jest.fn(),
};

const mockIntentDetectionService = {
  detectIntent: jest.fn(),
};

const mockModuleRef = {
  get: jest.fn().mockImplementation((token: unknown) => {
    if (token === IntentDetectionService) {
      return mockIntentDetectionService;
    }
    return null;
  }),
};

const mockAgentUsageGuardService = {
  checkUsageBeforeCall: jest.fn().mockResolvedValue({
    allowed: true,
    quota: { remaining: 1000, limit: 10000 },
    rateLimit: { allowed: true, remaining: 100 },
  }),
  recordUsageAfterCall: jest.fn().mockResolvedValue(undefined),
  updateUsageAfterCall: jest.fn().mockResolvedValue(undefined),
  getCostCalculator: jest.fn().mockReturnValue({
    estimateCost: jest.fn().mockReturnValue(10),
    calculateCost: jest.fn().mockReturnValue(10),
  }),
};

// ============================================================================
// TESTS
// ============================================================================

describe('NovaService', () => {
  let service: NovaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NovaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SmartCacheService, useValue: mockCacheService },
        { provide: LLMRouterService, useValue: mockLLMRouterService },
        { provide: ModuleRef, useValue: mockModuleRef },
        { provide: AgentUsageGuardService, useValue: mockAgentUsageGuardService },
      ],
    }).compile();

    service = module.get<NovaService>(NovaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chatWithContext', () => {
    const baseInput = {
      message: 'J’ai un problème de facturation',
      brandId: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      context: {
        currentPage: '/dashboard/billing',
        subscriptionPlan: 'pro',
      },
    };

    beforeEach(() => {
      // Reconfigure mocks after clearAllMocks
      mockModuleRef.get.mockImplementation((token: unknown) => {
        if (token === IntentDetectionService) {
          return mockIntentDetectionService;
        }
        return null;
      });

      mockCacheService.getOrSet.mockImplementation(
        (key: string, fn: () => Promise<unknown>) => fn(),
      );

      mockAgentUsageGuardService.checkUsageBeforeCall.mockResolvedValue({
        allowed: true,
        quota: { remaining: 1000, limit: 10000 },
        rateLimit: { allowed: true, remaining: 100 },
      });
      mockAgentUsageGuardService.updateUsageAfterCall.mockResolvedValue(undefined);
      mockAgentUsageGuardService.getCostCalculator.mockReturnValue({
        estimateCost: jest.fn().mockReturnValue(10),
        calculateCost: jest.fn().mockReturnValue({ costCents: 10 }),
      });

      mockIntentDetectionService.detectIntent.mockResolvedValue({
        intent: NovaIntentType.BILLING,
        confidence: 0.9,
        reasoning: 'User mentions billing',
      });

      mockLLMRouterService.chat.mockResolvedValue({
        content: 'Voici comment gérer votre facturation.',
        provider: 'openai',
        model: 'gpt-4',
        usage: { totalTokens: 100 },
      });

      mockPrismaService.knowledgeBaseArticle.findMany.mockResolvedValue([
        {
          id: 'article-1',
          title: 'Gérer sa facturation',
          slug: 'billing-management',
          content: 'Contenu...',
          excerpt: 'Résumé...',
          isPublished: true,
          isFeatured: true,
          helpful: 10,
          views: 100,
        },
      ]);

      mockPrismaService.ticket.create.mockResolvedValue({
        id: 'ticket-1',
        ticketNumber: 'TKT-00000001',
      });
      mockPrismaService.ticketMessage.create.mockResolvedValue({});
      mockPrismaService.ticketActivity.create.mockResolvedValue({});
      mockPrismaService.brand.findUnique.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        plan: 'pro',
      });
    });

    it('should process a support message and return response with articles', async () => {
      const result = await service.chatWithContext(baseInput);

      expect(result.message).toContain('facturation');
      expect(result.intent).toBe(NovaIntentType.BILLING);
      expect(result.resolved).toBe(true);
      expect(result.articles).toBeDefined();
      expect(result.articles?.length).toBeGreaterThan(0);
    });

    it('should create a ticket when escalation is needed', async () => {
      mockIntentDetectionService.detectIntent.mockResolvedValue({
        intent: NovaIntentType.TICKET, // Use TICKET intent to trigger escalation
        confidence: 0.9,
        reasoning: 'User wants to create a ticket',
      });

      const result = await service.chatWithContext(baseInput);

      expect(mockPrismaService.ticket.create).toHaveBeenCalled();
      expect(result.ticketId).toBe('ticket-1');
      expect(result.escalated).toBe(true);
    });

    it('should not create ticket if userId is missing', async () => {
      const inputWithoutUser = {
        ...baseInput,
        userId: undefined,
      };

      const result = await service.chatWithContext(inputWithoutUser as any);

      expect(mockPrismaService.ticket.create).not.toHaveBeenCalled();
      expect(result.ticketId).toBeUndefined();
    });
  });
});

