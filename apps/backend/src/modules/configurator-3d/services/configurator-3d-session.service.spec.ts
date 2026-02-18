/**
 * Configurator3DSessionService unit tests
 * Constructor: prisma, eventEmitter, pricingService
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Configurator3DSessionStatus, ConversionType, InteractionType } from '@prisma/client';
import { Configurator3DSessionService } from './configurator-3d-session.service';
import type { StartSessionDto, RecordInteractionDto } from './configurator-3d-session.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Configurator3DPricingService } from './configurator-3d-pricing.service';

describe('Configurator3DSessionService', () => {
  let service: Configurator3DSessionService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;
  let pricingService: Configurator3DPricingService;

  const sessionId = 'cfg3d_abc123';
  const configurationId = 'cfg-1';
  const brandId = 'brand-1';

  const mockPrisma = {
    configurator3DConfiguration: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    configurator3DSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    configurator3DInteraction: { createMany: jest.fn() },
    configurator3DSavedDesign: { create: jest.fn() },
  };

  const mockEventEmitter = { emit: jest.fn() };
  const mockPricingService = { calculate: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DSessionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: Configurator3DPricingService, useValue: mockPricingService },
      ],
    }).compile();

    service = module.get<Configurator3DSessionService>(Configurator3DSessionService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    pricingService = module.get<Configurator3DPricingService>(Configurator3DPricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('start', () => {
    it('should create session and increment configuration sessionCount', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        brandId,
        isActive: true,
        status: 'PUBLISHED',
      });
      const session = {
        id: 's1',
        sessionId,
        configurationId,
        status: Configurator3DSessionStatus.ACTIVE,
        configuration: {},
      };
      mockPrisma.configurator3DSession.create.mockResolvedValue(session);
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue({});

      const dto: StartSessionDto = { configurationId, visitorId: 'v1' };
      const result = await service.start(dto);

      expect(result).toEqual(session);
      expect(mockPrisma.configurator3DSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            configurationId,
            status: Configurator3DSessionStatus.ACTIVE,
          }),
        }),
      );
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalledWith({
        where: { id: configurationId },
        data: { sessionCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue(null);

      await expect(service.start({ configurationId: 'missing' })).rejects.toThrow(NotFoundException);
      await expect(service.start({ configurationId: 'missing' })).rejects.toThrow(
        /Configurator 3D configuration with ID missing not found/,
      );
    });

    it('should throw BadRequestException when configuration is not active', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        isActive: false,
      });

      await expect(service.start({ configurationId })).rejects.toThrow(BadRequestException);
      await expect(service.start({ configurationId })).rejects.toThrow(
        'Configurator 3D configuration is not active',
      );
    });
  });

  describe('startSession (backward compat)', () => {
    it('should call start with configurationId, visitorId, deviceInfo', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        brandId,
        isActive: true,
      });
      mockPrisma.configurator3DSession.create.mockResolvedValue({
        sessionId,
        configurationId,
        status: Configurator3DSessionStatus.ACTIVE,
      });
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue({});

      const result = await service.startSession(configurationId, 'visitor-1', { mobile: true });

      expect(mockPrisma.configurator3DSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            configurationId,
            visitorId: 'visitor-1',
            deviceInfo: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return session when found', async () => {
      const session = {
        sessionId,
        id: 's1',
        configuration: { brandId, name: 'Config' },
      };
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(session);

      const result = await service.findOne(sessionId);

      expect(result).toEqual(session);
      expect(mockPrisma.configurator3DSession.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sessionId } }),
      );
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing')).rejects.toThrow(/Session with ID missing not found/);
    });

    it('should throw NotFoundException when brandId does not match', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({
        sessionId,
        configuration: { brandId: 'other-brand' },
      });

      await expect(service.findOne(sessionId, { brandId })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when userId does not match session userId', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({
        sessionId,
        userId: 'user-2',
        configuration: { brandId },
      });

      await expect(service.findOne(sessionId, { userId: 'user-1' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update session selections and set lastActivityAt', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({
        id: 's1',
        configurationId,
        configuration: { enablePricing: false },
      });
      const updated = { sessionId, selections: { comp1: 'opt1' }, configuration: {} };
      mockPrisma.configurator3DSession.update.mockResolvedValue(updated);

      const result = await service.update(sessionId, { selections: { comp1: 'opt1' } });

      expect(result).toEqual(updated);
      expect(mockPrisma.configurator3DSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId },
          data: expect.objectContaining({
            selections: { comp1: 'opt1' },
            lastActivityAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should call pricingService when selections provided and enablePricing true', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({
        id: 's1',
        configurationId,
        configuration: { enablePricing: true },
      });
      mockPricingService.calculate.mockResolvedValue({ total: 100, breakdown: [] });
      mockPrisma.configurator3DSession.update.mockResolvedValue({
        sessionId,
        calculatedPrice: 100,
        configuration: {},
      });

      await service.update(sessionId, { selections: { comp1: 'opt1' } });

      expect(mockPricingService.calculate).toHaveBeenCalledWith(configurationId, { comp1: 'opt1' });
      expect(mockPrisma.configurator3DSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ calculatedPrice: 100 }),
        }),
      );
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { selections: {} })).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSession (backward compat)', () => {
    it('should call update with state and previewImageUrl', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({
        id: 's1',
        configurationId,
        configuration: { enablePricing: false },
      });
      mockPrisma.configurator3DSession.update.mockResolvedValue({
        sessionId,
        state: { color: '#fff' },
        previewImageUrl: 'https://img.png',
      });

      const result = await service.updateSession(sessionId, { color: '#fff' }, 'https://img.png');

      expect(mockPrisma.configurator3DSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId },
          data: expect.objectContaining({
            state: { color: '#fff' },
            previewImageUrl: 'https://img.png',
          }),
        }),
      );
    });
  });

  describe('recordInteraction', () => {
    it('should create interactions and return count', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.configurator3DInteraction.createMany.mockResolvedValue({ count: 2 });

      const dto: RecordInteractionDto[] = [
        { type: InteractionType.OPTION_SELECT, optionId: 'opt1', componentId: 'comp1' },
        { type: InteractionType.CAMERA_ROTATE, durationMs: 100 },
      ];
      const result = await service.recordInteraction(sessionId, dto);

      expect(result).toEqual({ success: true, count: 2 });
      expect(mockPrisma.configurator3DInteraction.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ type: InteractionType.OPTION_SELECT, optionId: 'opt1', componentId: 'comp1' }),
          expect.objectContaining({ type: InteractionType.CAMERA_ROTATE, durationMs: 100 }),
        ]),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(
        service.recordInteraction('missing', [{ type: InteractionType.OPTION_SELECT }]),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('saveConfiguration', () => {
    it('should create SavedDesign and update session status to SAVED', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({
        id: 's1',
        configurationId,
        calculatedPrice: 99,
        currency: 'EUR',
      });
      mockPrisma.configurator3DSavedDesign.create.mockResolvedValue({
        id: 'saved-1',
        name: 'My Design',
        shareToken: 'abc123',
      });
      mockPrisma.configurator3DSession.update.mockResolvedValue({});

      const result = await service.saveConfiguration(sessionId, {
        name: 'My Design',
        selections: { comp1: 'opt1' },
      });

      expect(result).toHaveProperty('shareUrl');
      expect(result.shareUrl).toMatch(/^\/share\/[a-f0-9]+$/);
      expect(mockPrisma.configurator3DSavedDesign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configurationId,
          sessionId: 's1',
          name: 'My Design',
          selections: { comp1: 'opt1' },
          savedPrice: 99,
        }),
      });
      expect(mockPrisma.configurator3DSession.update).toHaveBeenCalledWith({
        where: { sessionId },
        data: { status: Configurator3DSessionStatus.SAVED, savedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(
        service.saveConfiguration('missing', { name: 'X', selections: {} }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('saveSession (backward compat)', () => {
    it('should call saveConfiguration with default name and session selections', async () => {
      mockPrisma.configurator3DSession.findUnique
        .mockResolvedValueOnce({
          id: 's1',
          configurationId,
          selections: { comp1: 'opt1' },
          calculatedPrice: 50,
          currency: 'EUR',
        })
        .mockResolvedValueOnce({ id: 's1', configurationId, calculatedPrice: 50, currency: 'EUR' });
      mockPrisma.configurator3DSavedDesign.create.mockResolvedValue({
        id: 'saved-1',
        name: 'Design 2026-02-17',
        shareToken: 'tok',
      });
      mockPrisma.configurator3DSession.update.mockResolvedValue({});

      const result = await service.saveSession(sessionId);

      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
      expect(mockPrisma.configurator3DSavedDesign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: expect.stringMatching(/^Design \d{4}-\d{2}-\d{2}/),
          selections: { comp1: 'opt1' },
        }),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(service.saveSession('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('should set status to COMPLETED and completedAt', async () => {
      const startedAt = new Date(Date.now() - 60000);
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({ id: 's1', startedAt });
      mockPrisma.configurator3DSession.update.mockResolvedValue({
        sessionId,
        status: Configurator3DSessionStatus.COMPLETED,
        completedAt: new Date(),
      });

      const result = await service.complete(sessionId);

      expect(result.success).toBe(true);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(mockPrisma.configurator3DSession.update).toHaveBeenCalledWith({
        where: { sessionId },
        data: {
          status: Configurator3DSessionStatus.COMPLETED,
          completedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(service.complete('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addToCart', () => {
    it('should set CONVERTED, increment conversionCount, and emit event', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({
        id: 's1',
        configurationId,
        configuration: { brandId },
      });
      mockPrisma.configurator3DSession.update.mockResolvedValue({});
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue({});

      const result = await service.addToCart(sessionId, { orderId: 'ord-1', conversionValue: 199 });

      expect(result.success).toBe(true);
      expect(result.conversionType).toBe(ConversionType.ADD_TO_CART);
      expect(mockPrisma.configurator3DSession.update).toHaveBeenCalledWith({
        where: { sessionId },
        data: expect.objectContaining({
          status: Configurator3DSessionStatus.CONVERTED,
          conversionType: ConversionType.ADD_TO_CART,
          orderId: 'ord-1',
          conversionValue: 199,
        }),
      });
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalledWith({
        where: { id: configurationId },
        data: { conversionCount: { increment: 1 } },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('configurator3d.add-to-cart', {
        sessionId,
        configurationId,
        brandId,
        orderId: 'ord-1',
        conversionValue: 199,
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(service.addToCart('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete session', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({
        sessionId,
        configuration: { brandId },
      });
      mockPrisma.configurator3DSession.delete.mockResolvedValue({});

      const result = await service.delete(sessionId, brandId);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(mockPrisma.configurator3DSession.delete).toHaveBeenCalledWith({ where: { sessionId } });
    });

    it('should throw NotFoundException when session not found or brand mismatch', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing', brandId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated sessions for brand', async () => {
      const data = [{ sessionId, status: Configurator3DSessionStatus.ACTIVE, configuration: { name: 'C1' } }];
      mockPrisma.configurator3DSession.findMany.mockResolvedValue(data);
      mockPrisma.configurator3DSession.count.mockResolvedValue(1);

      const result = await service.findAll(brandId, { page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.configurator3DSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { configuration: { brandId } },
        }),
      );
    });

    it('should filter by configurationId when provided', async () => {
      mockPrisma.configurator3DSession.findMany.mockResolvedValue([]);
      mockPrisma.configurator3DSession.count.mockResolvedValue(0);

      await service.findAll(brandId, { configurationId });

      expect(mockPrisma.configurator3DSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ configurationId }),
        }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrisma.configurator3DSession.findMany.mockResolvedValue([]);
      mockPrisma.configurator3DSession.count.mockResolvedValue(0);

      await service.findAll(brandId, { status: Configurator3DSessionStatus.SAVED });

      expect(mockPrisma.configurator3DSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: Configurator3DSessionStatus.SAVED }),
        }),
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics object for brand', async () => {
      mockPrisma.configurator3DSession.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20);
      mockPrisma.configurator3DSession.findMany.mockResolvedValue([
        {
          startedAt: new Date(),
          savedAt: new Date(),
          completedAt: null,
          configuration: { id: 'cfg1', name: 'Config 1', productId: 'p1' },
        },
      ]);

      const result = await service.getAnalytics(brandId, 30);

      expect(result.totalSessions).toBe(100);
      expect(result.savedConfigs).toBe(20);
      expect(result).toHaveProperty('sessionsOverTime');
      expect(result).toHaveProperty('topProducts');
      expect(result).toHaveProperty('avgSessionDuration');
    });

    it('should return empty analytics when brandId is null/undefined', async () => {
      const result = await service.getAnalytics(undefined as any, 30);

      expect(result.totalSessions).toBe(0);
      expect(result.savedConfigs).toBe(0);
      expect(result.sessionsOverTime).toEqual([]);
      expect(result.topProducts).toEqual([]);
    });
  });
});
