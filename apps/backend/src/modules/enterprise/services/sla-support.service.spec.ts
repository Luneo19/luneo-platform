/**
 * Tests unitaires pour SLASupportService
 * TEST-NEW-01: Couverture des fonctionnalités critiques
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SLASupportService } from './sla-support.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SLASupportService', () => {
  let service: SLASupportService;
  let prismaService: any; // Use any for mock methods

  const mockBrand = {
    id: 'brand-123',
    plan: 'professional',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SLASupportService,
        {
          provide: PrismaService,
          useValue: {
            brand: { findUnique: jest.fn() },
            sLATicket: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
          },
        },
        {
          provide: SmartCacheService,
          useValue: { 
            get: jest.fn((key, strategy, fn) => fn()), // Execute the callback directly
            set: jest.fn(),
            getSimple: jest.fn(), 
            setSimple: jest.fn(),
            invalidateTags: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SLASupportService>(SLASupportService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSLAConfig', () => {
    it('should return starter config for unknown plan', () => {
      const config = service.getSLAConfig('unknown-plan');
      expect(config.planId).toBe('starter');
      expect(config.responseTimeHours).toBe(48);
    });

    it('should return correct config for professional plan', () => {
      const config = service.getSLAConfig('professional');
      expect(config.responseTimeHours).toBe(24);
      expect(config.prioritySupport).toBe(true);
    });

    it('should return correct config for enterprise plan', () => {
      const config = service.getSLAConfig('enterprise');
      expect(config.responseTimeHours).toBe(1);
      expect(config.uptimePercent).toBe(99.99);
      expect(config.escalationLevels.length).toBe(3);
    });
  });

  describe('createSLATicket', () => {
    it('should throw BadRequestException when ticketId is empty', async () => {
      await expect(
        service.createSLATicket('', 'brand-123', 'high')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when brandId is empty', async () => {
      await expect(
        service.createSLATicket('ticket-1', '', 'high')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when brand not found', async () => {
      prismaService.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.createSLATicket('ticket-1', 'non-existent', 'high')
      ).rejects.toThrow(NotFoundException);
    });

    it('should create SLA ticket with correct deadlines', async () => {
      prismaService.brand.findUnique.mockResolvedValue(mockBrand as any);
      prismaService.sLATicket.create.mockResolvedValue({
        id: 'sla-1',
        ticketId: 'ticket-1',
        slaStatus: 'on_time',
      } as any);

      const result = await service.createSLATicket('ticket-1', 'brand-123', 'high');

      expect(result.slaStatus).toBe('on_time');
      expect(prismaService.sLATicket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: 'ticket-1',
          brandId: 'brand-123',
          planId: 'professional',
          priority: 'high',
          slaStatus: 'on_time',
          escalationLevel: 0,
        }),
      });
    });
  });

  describe('getSLATicket', () => {
    it('should throw BadRequestException when ticketId is empty', async () => {
      await expect(service.getSLATicket('')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when ticket not found', async () => {
      prismaService.sLATicket.findFirst.mockResolvedValue(null);

      await expect(service.getSLATicket('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return ticket when found', async () => {
      const mockTicket = { id: 'sla-1', ticketId: 'ticket-1' };
      prismaService.sLATicket.findFirst.mockResolvedValue(mockTicket as any);

      const result = await service.getSLATicket('ticket-1');

      expect(result.ticketId).toBe('ticket-1');
    });
  });

  describe('calculateSLAMetrics', () => {
    it('should throw BadRequestException when brandId is empty', async () => {
      await expect(
        service.calculateSLAMetrics('', new Date(), new Date())
      ).rejects.toThrow(BadRequestException);
    });

    it('should return empty metrics when no tickets', async () => {
      prismaService.sLATicket.count.mockResolvedValue(0);
      prismaService.sLATicket.groupBy.mockResolvedValue([]);
      prismaService.sLATicket.findMany.mockResolvedValue([]);

      const result = await service.calculateSLAMetrics(
        'brand-123',
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      expect(result.totalTickets).toBe(0);
      expect(result.slaCompliancePercent).toBe(100);
    });

    it('should calculate metrics correctly', async () => {
      prismaService.sLATicket.count.mockResolvedValue(10);
      prismaService.sLATicket.groupBy.mockResolvedValue([
        { slaStatus: 'on_time', _count: 7 },
        { slaStatus: 'at_risk', _count: 2 },
        { slaStatus: 'breached', _count: 1 },
      ] as any);
      prismaService.sLATicket.findMany.mockResolvedValue([]);

      const result = await service.calculateSLAMetrics(
        'brand-123',
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      expect(result.totalTickets).toBe(10);
      expect(result.ticketsOnTime).toBe(7);
      expect(result.ticketsAtRisk).toBe(2);
      expect(result.ticketsBreached).toBe(1);
      expect(result.slaCompliancePercent).toBe(70);
    });
  });
});
