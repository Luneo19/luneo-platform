import { Test, TestingModule } from '@nestjs/testing';
import {
  QuotaEnforcementService,
  QuotaExceededException,
} from '../quota-enforcement.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

describe('QuotaEnforcementService', () => {
  let service: QuotaEnforcementService;

  const mockPrisma = {
    organization: {
      findUnique: jest.fn(),
    },
    agent: {
      count: jest.fn(),
    },
    knowledgeBase: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    knowledgeSource: {
      count: jest.fn(),
    },
    channel: {
      count: jest.fn(),
    },
    organizationMember: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaEnforcementService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuotaEnforcementService>(QuotaEnforcementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('checkQuota should return FREE plan limit', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-free',
      plan: 'FREE',
      conversationsUsed: 20,
    });

    const result = await service.checkQuota('org-free', 'messages_per_month');

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(20);
    expect(result.limit).toBe(100);
    expect(result.percentage).toBe(20);
  });

  it('enforceQuota should throw when over limit', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-free',
      plan: 'FREE',
      conversationsUsed: 0,
    });
    mockPrisma.agent.count.mockResolvedValue(1);

    await expect(service.enforceQuota('org-free', 'agents')).rejects.toThrow(
      QuotaExceededException,
    );
    await expect(service.enforceQuota('org-free', 'agents')).rejects.toThrow(
      /Quota exceeded for agents/,
    );
  });

  it('unlimited limits (-1) should always allow', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-ent',
      plan: 'ENTERPRISE',
      conversationsUsed: 999999,
    });
    mockPrisma.agent.count.mockResolvedValue(5000);

    const result = await service.checkQuota('org-ent', 'agents');

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(-1);
    expect(result.percentage).toBe(0);
  });
});
