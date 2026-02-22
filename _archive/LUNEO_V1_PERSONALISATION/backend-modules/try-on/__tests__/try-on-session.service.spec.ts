import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TryOnSessionService } from '../services/try-on-session.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('TryOnSessionService', () => {
  let service: TryOnSessionService;

  const mockPrisma = {
    tryOnConfiguration: { findUnique: jest.fn() },
    tryOnSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    product: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TryOnSessionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TryOnSessionService>(TryOnSessionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSession', () => {
    it('should create session when configuration exists and is active', async () => {
      mockPrisma.tryOnConfiguration.findUnique.mockResolvedValue({
        id: 'config-1',
        isActive: true,
      });
      const created = {
        id: 'session-1',
        sessionId: 'ses_abc',
        visitorId: 'visitor-1',
        startedAt: new Date(),
        configuration: { id: 'config-1', name: 'Config', productType: 'GLASSES', settings: {}, uiConfig: {} },
      };
      mockPrisma.tryOnSession.create.mockResolvedValue(created);
      const result = await service.startSession('config-1', 'visitor-1');
      expect(result.sessionId).toMatch(/^ses_[a-f0-9]+$/);
      expect(result.visitorId).toBe('visitor-1');
      expect(mockPrisma.tryOnSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configurationId: 'config-1',
          visitorId: 'visitor-1',
          productsTried: [],
        }),
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.tryOnConfiguration.findUnique.mockResolvedValue(null);
      await expect(
        service.startSession('invalid-config', 'visitor-1'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.tryOnSession.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when configuration is not active', async () => {
      mockPrisma.tryOnConfiguration.findUnique.mockResolvedValue({
        id: 'config-1',
        isActive: false,
      });
      await expect(
        service.startSession('config-1', 'visitor-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateSession', () => {
    it('should update session with productsTried and converted', async () => {
      mockPrisma.tryOnSession.findUnique.mockResolvedValue({
        id: 'db-id-1',
      });
      const updated = {
        id: 'db-id-1',
        sessionId: 'ses_abc',
        productsTried: ['prod-1'],
        screenshotsTaken: 2,
        shared: true,
        converted: true,
        startedAt: new Date(),
        endedAt: null,
      };
      mockPrisma.tryOnSession.update.mockResolvedValue(updated);
      const result = await service.updateSession('ses_abc', {
        productsTried: ['prod-1'],
        screenshotsTaken: 2,
        shared: true,
        converted: true,
      });
      expect(result.converted).toBe(true);
      expect(result.productsTried).toEqual(['prod-1']);
      expect(mockPrisma.tryOnSession.update).toHaveBeenCalledWith({
        where: { id: 'db-id-1' },
        data: expect.any(Object),
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.tryOnSession.findUnique.mockResolvedValue(null);
      await expect(
        service.updateSession('invalid-session', { productsTried: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('endSession', () => {
    it('should set endedAt when session exists', async () => {
      mockPrisma.tryOnSession.findUnique.mockResolvedValue({ id: 'db-id-1' });
      const ended = {
        id: 'db-id-1',
        sessionId: 'ses_abc',
        startedAt: new Date(),
        endedAt: new Date(),
        productsTried: [],
        screenshotsTaken: 0,
        shared: false,
        converted: false,
      };
      mockPrisma.tryOnSession.update.mockResolvedValue(ended);
      const result = await service.endSession('ses_abc');
      expect(result.endedAt).toBeDefined();
      expect(mockPrisma.tryOnSession.update).toHaveBeenCalledWith({
        where: { id: 'db-id-1' },
        data: { endedAt: expect.any(Date) },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.tryOnSession.findUnique.mockResolvedValue(null);
      await expect(service.endSession('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return session by sessionId', async () => {
      const session = {
        id: 'db-1',
        sessionId: 'ses_abc',
        visitorId: 'v1',
        configuration: { id: 'c1', name: 'C', productType: 'GLASSES' },
        screenshots: [],
      };
      mockPrisma.tryOnSession.findUnique.mockResolvedValue(session);
      const result = await service.findOne('ses_abc');
      expect(result).toEqual(session);
      expect(mockPrisma.tryOnSession.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'ses_abc' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.tryOnSession.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return sessions for configuration', async () => {
      const sessions = [
        { id: 's1', sessionId: 'ses_1', visitorId: 'v1', startedAt: new Date(), endedAt: null, productsTried: [], screenshotsTaken: 0, shared: false, converted: false },
      ];
      mockPrisma.tryOnSession.findMany.mockResolvedValue(sessions);
      const result = await service.findAll('config-1', 50);
      expect(result).toEqual(sessions);
      expect(mockPrisma.tryOnSession.findMany).toHaveBeenCalledWith({
        where: { configurationId: 'config-1' },
        orderBy: { startedAt: 'desc' },
        take: 50,
        select: expect.any(Object),
      });
    });
  });

  describe('getAnalytics', () => {
    it('should return empty analytics when brandId is null', async () => {
      const result = await service.getAnalytics(null, 30);
      expect(result.totalSessions).toBe(0);
      expect(result.conversionRate).toBe(0);
      expect(result.sessionsOverTime).toEqual([]);
    });

    it('should return aggregated analytics for brand', async () => {
      mockPrisma.tryOnSession.count.mockResolvedValue(10);
      mockPrisma.tryOnSession.aggregate.mockResolvedValue({
        _sum: { screenshotsTaken: 15 },
      });
      mockPrisma.tryOnSession.findMany.mockResolvedValue([
        {
          startedAt: new Date(),
          endedAt: new Date(Date.now() + 60000),
          productsTried: ['p1'],
          converted: true,
          configuration: { productType: 'GLASSES' },
        },
      ]);
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Product 1' },
      ]);
      const result = await service.getAnalytics('brand-1', 30);
      expect(result.totalSessions).toBe(10);
      expect(result.totalScreenshots).toBe(15);
      expect(result.conversionRate).toBeGreaterThanOrEqual(0);
    });
  });
});
