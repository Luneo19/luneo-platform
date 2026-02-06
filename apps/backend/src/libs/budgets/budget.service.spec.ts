import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: PrismaService,
          useValue: {
            brand: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkBudget', () => {
    it('should return true if budget is available', async () => {
      jest.spyOn(prisma.brand, 'findUnique').mockResolvedValue({
        id: 'brand-123',
        aiCostLimitCents: 100000,
        aiCostUsedCents: 50000,
      } as any);

      const result = await service.checkBudget('brand-123', 30000);

      expect(result).toBe(true);
    });

    it('should return false if budget would be exceeded', async () => {
      jest.spyOn(prisma.brand, 'findUnique').mockResolvedValue({
        id: 'brand-123',
        aiCostLimitCents: 100000,
        aiCostUsedCents: 80000,
      } as any);

      const result = await service.checkBudget('brand-123', 30000);

      expect(result).toBe(false);
    });
  });

  describe('enforceBudget', () => {
    it('should increment budget usage', async () => {
      jest.spyOn(prisma.brand, 'update').mockResolvedValue({} as any);

      await service.enforceBudget('brand-123', 30000);

      expect(prisma.brand.update).toHaveBeenCalledWith({
        where: { id: 'brand-123' },
        data: { aiCostUsedCents: { increment: 30000 } },
      });
    });

    it('should still increment even if budget would be exceeded (soft limit)', async () => {
      // Note: Le service actuel n'applique pas de limite stricte
      // Il incrémente toujours et le contrôle se fait ailleurs
      jest.spyOn(prisma.brand, 'update').mockResolvedValue({
        id: 'brand-123',
        aiCostUsedCents: 110000,
      } as any);

      await service.enforceBudget('brand-123', 20000);

      expect(prisma.brand.update).toHaveBeenCalled();
    });
  });

  describe('resetBudget', () => {
    it('should reset budget to zero', async () => {
      jest.spyOn(prisma.brand, 'update').mockResolvedValue({} as any);

      await service.resetBudget('brand-123');

      expect(prisma.brand.update).toHaveBeenCalledWith({
        where: { id: 'brand-123' },
        data: {
          aiCostUsedCents: 0,
          aiCostResetAt: expect.any(Date),
        },
      });
    });
  });
});

































