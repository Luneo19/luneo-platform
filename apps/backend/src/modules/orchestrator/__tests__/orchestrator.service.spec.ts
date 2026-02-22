/**
 * OrchestratorService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrchestratorService } from '../orchestrator.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { RagService } from '@/modules/rag/rag.service';
import { LlmService } from '@/libs/llm/llm.service';

const mockPrisma = {
  agent: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  conversation: {
    update: jest.fn(),
  },
};

const mockRagService = {
  retrieveContext: jest.fn(),
};

const mockLlmService = {
  complete: jest.fn(),
};

describe('OrchestratorService', () => {
  let service: OrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrchestratorService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
        { provide: RagService, useValue: mockRagService },
        { provide: LlmService, useValue: mockLlmService },
      ],
    }).compile();

    service = module.get<OrchestratorService>(OrchestratorService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeAgent', () => {
    const baseAgent = {
      id: 'agent-1',
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokensPerReply: 1000,
      contextWindow: 10,
      systemPrompt: 'You are a helpful assistant.',
      customInstructions: null,
      tone: 'PROFESSIONAL',
      autoEscalate: true,
      confidenceThreshold: 0.7,
      agentKnowledgeBases: [] as { knowledgeBase: unknown }[],
    };

    it('should execute successfully with knowledge bases (calls RAG, LLM, saves message, updates stats)', async () => {
      const agentWithKbs = {
        ...baseAgent,
        agentKnowledgeBases: [{ knowledgeBase: { id: 'kb-1' } }],
      };
      const history = [
        { id: 'm1', role: 'USER', content: 'Hi', conversationId: 'conv-1', createdAt: new Date() },
        { id: 'm2', role: 'ASSISTANT', content: 'Hello!', conversationId: 'conv-1', createdAt: new Date() },
      ];
      const ragResult = {
        context: 'Context from KB',
        sources: [
          { chunkId: 'c1', content: 'chunk', score: 0.9, documentTitle: 'Doc 1' },
        ],
      };
      const completion = {
        content: 'AI response',
        model: 'gpt-4o-mini',
        tokensIn: 100,
        tokensOut: 50,
        costUsd: 0.001,
      };

      mockPrisma.agent.findUnique.mockResolvedValue(agentWithKbs);
      mockPrisma.message.findMany.mockResolvedValue(history);
      mockRagService.retrieveContext.mockResolvedValue(ragResult);
      mockLlmService.complete.mockResolvedValue(completion);
      mockPrisma.message.create.mockResolvedValue({});
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.agent.update.mockResolvedValue({});

      const result = await service.executeAgent(
        'agent-1',
        'conv-1',
        'User question',
      );

      expect(result.content).toBe('AI response');
      expect(result.sources).toEqual(ragResult.sources);
      expect(result.tokensIn).toBe(100);
      expect(result.tokensOut).toBe(50);
      expect(result.costUsd).toBe(0.001);
      expect(result.model).toBe('gpt-4o-mini');

      expect(mockRagService.retrieveContext).toHaveBeenCalledWith(
        'User question',
        'agent-1',
        { topK: 5, minScore: 0.7 },
      );
      expect(mockLlmService.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'User question' }),
          ]),
        }),
      );
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          conversationId: 'conv-1',
          role: 'ASSISTANT',
          content: 'AI response',
          model: 'gpt-4o-mini',
          tokensIn: 100,
          tokensOut: 50,
          costUsd: 0.001,
        }),
      });
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: {
          messageCount: { increment: 1 },
          agentMessageCount: { increment: 1 },
          totalTokensIn: { increment: 100 },
          totalTokensOut: { increment: 50 },
          totalCostUsd: { increment: 0.001 },
        },
      });
      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: {
          totalMessages: { increment: 1 },
          currentMonthSpend: { increment: 0.001 },
          lastActiveAt: expect.any(Date),
        },
      });
    });

    it('should execute without knowledge bases (skips RAG, calls LLM directly)', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(baseAgent);
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockLlmService.complete.mockResolvedValue({
        content: 'Direct response',
        model: 'gpt-4o-mini',
        tokensIn: 50,
        tokensOut: 20,
        costUsd: 0.0005,
      });
      mockPrisma.message.create.mockResolvedValue({});
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.agent.update.mockResolvedValue({});

      const result = await service.executeAgent(
        'agent-1',
        'conv-1',
        'Simple question',
      );

      expect(result.content).toBe('Direct response');
      expect(result.sources).toEqual([]);
      expect(mockRagService.retrieveContext).not.toHaveBeenCalled();
      expect(mockLlmService.complete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(null);

      await expect(
        service.executeAgent('missing', 'conv-1', 'Hello'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.executeAgent('missing', 'conv-1', 'Hello'),
      ).rejects.toThrow(/introuvable/);
      expect(mockLlmService.complete).not.toHaveBeenCalled();
    });

    it('should handle LLM failure gracefully (propagates error)', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(baseAgent);
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockLlmService.complete.mockRejectedValue(new Error('LLM API error'));

      await expect(
        service.executeAgent('agent-1', 'conv-1', 'Hello'),
      ).rejects.toThrow('LLM API error');
      expect(mockPrisma.message.create).not.toHaveBeenCalled();
    });

    it('should save message with correct fields (model, tokensIn, tokensOut, costUsd)', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(baseAgent);
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockLlmService.complete.mockResolvedValue({
        content: 'Response',
        model: 'gpt-4o',
        tokensIn: 200,
        tokensOut: 80,
        costUsd: 0.002,
      });
      mockPrisma.message.create.mockResolvedValue({});
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.agent.update.mockResolvedValue({});

      await service.executeAgent('agent-1', 'conv-1', 'Question');

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          model: 'gpt-4o',
          tokensIn: 200,
          tokensOut: 80,
          costUsd: 0.002,
        }),
      });
    });

    it('should update conversation stats (messageCount, totalCostUsd)', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(baseAgent);
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockLlmService.complete.mockResolvedValue({
        content: 'R',
        model: 'gpt-4o-mini',
        tokensIn: 10,
        tokensOut: 5,
        costUsd: 0.0001,
      });
      mockPrisma.message.create.mockResolvedValue({});
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.agent.update.mockResolvedValue({});

      await service.executeAgent('agent-1', 'conv-1', 'Q');

      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: {
          messageCount: { increment: 1 },
          agentMessageCount: { increment: 1 },
          totalTokensIn: { increment: 10 },
          totalTokensOut: { increment: 5 },
          totalCostUsd: { increment: 0.0001 },
        },
      });
    });

    it('should update agent stats (totalMessages, currentMonthSpend)', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(baseAgent);
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockLlmService.complete.mockResolvedValue({
        content: 'R',
        model: 'gpt-4o-mini',
        tokensIn: 10,
        tokensOut: 5,
        costUsd: 0.0002,
      });
      mockPrisma.message.create.mockResolvedValue({});
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.agent.update.mockResolvedValue({});

      await service.executeAgent('agent-1', 'conv-1', 'Q');

      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: {
          totalMessages: { increment: 1 },
          currentMonthSpend: { increment: 0.0002 },
          lastActiveAt: expect.any(Date),
        },
      });
    });
  });
});
