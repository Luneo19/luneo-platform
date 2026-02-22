import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrionService } from '../orion.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { OrionAgentStatus, OrionAgentType, ChurnRisk } from '@prisma/client';

describe('OrionService', () => {
  let service: OrionService;

  const mockAgents = [
    {
      id: 'agent-1',
      name: 'APOLLO',
      displayName: 'Apollo',
      type: OrionAgentType.ACQUISITION,
      status: OrionAgentStatus.ACTIVE,
      description: 'Lead scoring',
    },
  ];

  const mockPrisma = {
    orionAgent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    user: { count: jest.fn() },
    customerHealthScore: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((arg) => (Array.isArray(arg) ? Promise.all(arg) : arg)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrionService>(OrionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return agents and metrics', async () => {
      mockPrisma.orionAgent.findMany.mockResolvedValue(mockAgents);
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.customerHealthScore.count.mockResolvedValue(5);
      const result = await service.getOverview();
      expect(result.agents).toEqual(mockAgents);
      expect(result.metrics.totalCustomers).toBe(100);
      expect(result.metrics.activeCustomers).toBe(100);
      expect(result.metrics.atRiskCustomers).toBe(5);
      expect(result.metrics.agentsActive).toBe(1);
      expect(result.metrics.agentsTotal).toBe(1);
    });
  });

  describe('getAgents', () => {
    it('should return all agents ordered by name', async () => {
      mockPrisma.orionAgent.findMany.mockResolvedValue(mockAgents);
      const result = await service.getAgents();
      expect(result).toEqual(mockAgents);
      expect(mockPrisma.orionAgent.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getAgent', () => {
    it('should return agent by id', async () => {
      mockPrisma.orionAgent.findUnique.mockResolvedValue(mockAgents[0]);
      const result = await service.getAgent('agent-1');
      expect(result).toEqual(mockAgents[0]);
      expect(mockPrisma.orionAgent.findUnique).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
      });
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrisma.orionAgent.findUnique.mockResolvedValue(null);
      await expect(service.getAgent('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAgent', () => {
    it('should update agent status and config', async () => {
      const updated = { ...mockAgents[0], status: OrionAgentStatus.PAUSED };
      mockPrisma.orionAgent.update.mockResolvedValue(updated);
      const result = await service.updateAgent('agent-1', {
        status: 'PAUSED',
        config: { key: 'value' },
      });
      expect(result.status).toBe(OrionAgentStatus.PAUSED);
      expect(mockPrisma.orionAgent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: expect.objectContaining({
          status: OrionAgentStatus.PAUSED,
          config: { key: 'value' },
        }),
      });
    });
  });

  describe('seedAgents', () => {
    it('should upsert default ORION agents', async () => {
      mockPrisma.$transaction.mockImplementation((arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg) : arg,
      );
      mockPrisma.orionAgent.upsert.mockResolvedValue({});
      await service.seedAgents();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.orionAgent.upsert).toHaveBeenCalled();
    });
  });

  describe('getHealthScores', () => {
    it('should return health scores with optional filter', async () => {
      const scores = [
        {
          id: 'hs-1',
          userId: 'u1',
          healthScore: 50,
          churnRisk: ChurnRisk.HIGH,
          user: { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B' },
        },
      ];
      mockPrisma.customerHealthScore.findMany.mockResolvedValue(scores);
      const result = await service.getHealthScores({
        churnRisk: 'HIGH',
        limit: 10,
      });
      expect(result).toEqual(scores);
      expect(mockPrisma.customerHealthScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { churnRisk: ChurnRisk.HIGH },
          take: 10,
        }),
      );
    });
  });
});
