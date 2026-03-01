import { Test, TestingModule } from '@nestjs/testing';
import { LearningService } from './learning.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { KnowledgeGapStatus, LearningSignalType, PlatformRole } from '@prisma/client';

describe('LearningService', () => {
  let service: LearningService;

  const mockPrisma = {
    conversation: {
      findFirst: jest.fn(),
    },
    learningSignal: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    knowledgeGap: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      findMany: jest.fn(),
    },
    verticalInsight: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LearningService>(LearningService);
    jest.clearAllMocks();
  });

  it('records signal and creates gap when needed', async () => {
    mockPrisma.conversation.findFirst.mockResolvedValue({ id: 'c1', organizationId: 'o1' });
    mockPrisma.learningSignal.create.mockResolvedValue({ id: 's1' });
    mockPrisma.knowledgeGap.findFirst.mockResolvedValue(null);
    mockPrisma.knowledgeGap.create.mockResolvedValue({ id: 'g1' });

    const result = await service.recordSignal(
      {
        id: 'u1',
        email: 'u@example.com',
        role: PlatformRole.USER,
        organizationId: 'o1',
      },
      {
        conversationId: 'c1',
        signalType: LearningSignalType.KNOWLEDGE_GAP,
        data: { question: 'Ou est ma commande ?' },
      },
    );

    expect(result).toHaveProperty('id', 's1');
    expect(mockPrisma.knowledgeGap.create).toHaveBeenCalled();
  });

  it('lists gaps with pagination metadata', async () => {
    mockPrisma.knowledgeGap.findMany.mockResolvedValue([{ id: 'g1' }]);
    mockPrisma.knowledgeGap.count.mockResolvedValue(1);

    const result = await service.listGaps(
      {
        id: 'u1',
        email: 'u@example.com',
        role: PlatformRole.USER,
        organizationId: 'o1',
      },
      { page: 1, limit: 20, status: KnowledgeGapStatus.DETECTED },
    );

    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});
