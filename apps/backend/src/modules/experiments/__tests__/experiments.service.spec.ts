import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExperimentsService } from '../experiments.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('ExperimentsService', () => {
  let service: ExperimentsService;

  const mockPrisma = {
    experiment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    experimentAssignment: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    conversion: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperimentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExperimentsService>(ExperimentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExperiment', () => {
    it('should create experiment with normalized variants', async () => {
      const created = {
        id: 'exp-1',
        name: 'Test Experiment',
        variants: [
          { id: 'control', name: 'Control', weight: 0.5 },
          { id: 'variant', name: 'Variant', weight: 0.5 },
        ],
      };
      mockPrisma.experiment.create.mockResolvedValue(created);
      const result = await service.createExperiment('Test Experiment', [
        { id: 'control', name: 'Control', weight: 100 },
        { id: 'variant', name: 'Variant', weight: 100 },
      ]);
      expect(result).toEqual(created);
      expect(mockPrisma.experiment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Experiment',
          status: 'draft',
          variants: expect.any(Array),
        }),
      });
    });

    it('should throw BadRequestException when name is empty', async () => {
      await expect(
        service.createExperiment('', [
          { id: 'a', name: 'A', weight: 1 },
          { id: 'b', name: 'B', weight: 1 },
        ]),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.experiment.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when fewer than 2 variants', async () => {
      await expect(
        service.createExperiment('Exp', [{ id: 'a', name: 'A', weight: 1 }]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAssignment', () => {
    it('should return existing assignment when present', async () => {
      const experiment = {
        id: 'exp-1',
        name: 'test-exp',
        status: 'running',
        variants: [
          { id: 'v1', name: 'V1', weight: 0.5 },
          { id: 'v2', name: 'V2', weight: 0.5 },
        ],
      };
      mockPrisma.experiment.findFirst.mockResolvedValue(experiment);
      mockPrisma.experimentAssignment.findUnique.mockResolvedValue({
        variantId: 'v1',
      });
      const result = await service.getAssignment('user-1', 'test-exp');
      expect(result).toEqual({ variant: 'v1' });
      expect(mockPrisma.experimentAssignment.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when experiment not found', async () => {
      mockPrisma.experiment.findFirst.mockResolvedValue(null);
      await expect(
        service.getAssignment('user-1', 'missing-exp'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordConversion', () => {
    it('should create conversion record', async () => {
      const experiment = { id: 'exp-1', name: 'test-exp' };
      mockPrisma.experiment.findFirst.mockResolvedValue(experiment);
      mockPrisma.experimentAssignment.findUnique.mockResolvedValue({
        variantId: 'v1',
      });
      mockPrisma.conversion.create.mockResolvedValue({
        id: 'conv-1',
        userId: 'user-1',
        experimentId: 'exp-1',
        variantId: 'v1',
      });
      const result = await service.recordConversion('user-1', 'test-exp', {
        value: 10,
      });
      expect(result.variantId).toBe('v1');
      expect(mockPrisma.conversion.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when experiment not found', async () => {
      mockPrisma.experiment.findFirst.mockResolvedValue(null);
      await expect(
        service.recordConversion('user-1', 'missing-exp'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getResults', () => {
    it('should return results by variant', async () => {
      const experiment = {
        id: 'exp-1',
        name: 'test-exp',
        variants: [
          { id: 'v1', name: 'Control' },
          { id: 'v2', name: 'Variant' },
        ],
        assignments: [
          { variantId: 'v1' },
          { variantId: 'v1' },
          { variantId: 'v2' },
        ],
        conversions: [
          { variantId: 'v1', value: 5 },
          { variantId: 'v2', value: 10 },
        ],
      };
      mockPrisma.experiment.findFirst.mockResolvedValue(experiment);
      const result = await service.getResults('test-exp');
      expect(result.experiment.name).toBe('test-exp');
      expect(result.results).toHaveLength(2);
      const v1Result = result.results.find((r: any) => r.variantId === 'v1');
      expect(v1Result?.assignments).toBe(2);
    });

    it('should throw NotFoundException when experiment not found', async () => {
      mockPrisma.experiment.findFirst.mockResolvedValue(null);
      await expect(service.getResults('missing-exp')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all experiments', async () => {
      const experiments = [{ id: 'e1', name: 'Exp1', _count: { assignments: 5, conversions: 2 } }];
      mockPrisma.experiment.findMany.mockResolvedValue(experiments);
      const result = await service.findAll();
      expect(result).toEqual(experiments);
      expect(mockPrisma.experiment.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { assignments: true, conversions: true } } },
      });
    });
  });
});
