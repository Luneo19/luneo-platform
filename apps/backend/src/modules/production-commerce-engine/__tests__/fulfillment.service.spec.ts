import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FulfillmentService } from '@/modules/production-commerce-engine/fulfillment/services/fulfillment.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { FulfillmentStatus } from '@prisma/client';
import { PCE_EVENTS } from '@/modules/production-commerce-engine/pce.constants';

describe('FulfillmentService', () => {
  let service: FulfillmentService;
  let prisma: {
    pipeline: { findUnique: jest.Mock };
    fulfillment: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock; count: jest.Mock };
  };
  let eventEmitter: { emit: jest.Mock };

  const pipelineId = 'pipeline-1';
  const brandId = 'brand-1';
  const mockPipeline = {
    id: pipelineId,
    orderId: 'order-1',
    brandId,
    currentStage: 'FULFILLMENT',
    status: 'IN_PROGRESS',
  };
  const mockFulfillment = {
    id: 'fulfillment-1',
    pipelineId,
    orderId: 'order-1',
    brandId,
    status: FulfillmentStatus.PENDING,
    trackingNumber: null,
    trackingUrl: null,
    carrier: null,
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      pipeline: { findUnique: jest.fn() },
      fulfillment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FulfillmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(FulfillmentService);
  });

  describe('createFulfillment', () => {
    it('should create a fulfillment and emit FULFILLMENT_CREATED event', async () => {
      prisma.pipeline.findUnique.mockResolvedValue(mockPipeline);
      prisma.fulfillment.findUnique.mockResolvedValue(null);
      prisma.fulfillment.create.mockResolvedValue(mockFulfillment);

      const result = await service.createFulfillment(pipelineId, brandId);

      expect(result).toEqual(mockFulfillment);
      expect(prisma.pipeline.findUnique).toHaveBeenCalledWith({ where: { id: pipelineId } });
      expect(prisma.fulfillment.create).toHaveBeenCalledWith({
        data: {
          pipelineId,
          orderId: mockPipeline.orderId,
          brandId,
          status: FulfillmentStatus.PENDING,
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.FULFILLMENT_CREATED, {
        fulfillmentId: mockFulfillment.id,
        pipelineId,
        orderId: mockFulfillment.orderId,
        brandId,
      });
    });

    it('should throw NotFoundException when pipeline not found', async () => {
      prisma.pipeline.findUnique.mockResolvedValue(null);

      await expect(service.createFulfillment(pipelineId, brandId)).rejects.toThrow(NotFoundException);
      await expect(service.createFulfillment(pipelineId, brandId)).rejects.toThrow(
        `Pipeline ${pipelineId} not found`,
      );
      expect(prisma.fulfillment.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when pipeline does not belong to brand', async () => {
      prisma.pipeline.findUnique.mockResolvedValue({ ...mockPipeline, brandId: 'other-brand' });

      await expect(service.createFulfillment(pipelineId, brandId)).rejects.toThrow(BadRequestException);
      await expect(service.createFulfillment(pipelineId, brandId)).rejects.toThrow(
        'Pipeline does not belong to brand',
      );
    });

    it('should throw BadRequestException when fulfillment already exists for pipeline', async () => {
      prisma.pipeline.findUnique.mockResolvedValue(mockPipeline);
      prisma.fulfillment.findUnique.mockResolvedValue(mockFulfillment);

      await expect(service.createFulfillment(pipelineId, brandId)).rejects.toThrow(BadRequestException);
      await expect(service.createFulfillment(pipelineId, brandId)).rejects.toThrow(
        `Fulfillment already exists for pipeline ${pipelineId}`,
      );
      expect(prisma.fulfillment.create).not.toHaveBeenCalled();
    });
  });

  describe('getFulfillment', () => {
    it('should return fulfillment when found and brand matches', async () => {
      const withPipeline = { ...mockFulfillment, pipeline: { id: pipelineId, currentStage: 'FULFILLMENT', status: 'IN_PROGRESS', orderId: 'order-1' } };
      prisma.fulfillment.findUnique.mockResolvedValue(withPipeline);

      const result = await service.getFulfillment('fulfillment-1', brandId);

      expect(result).toEqual(withPipeline);
      expect(prisma.fulfillment.findUnique).toHaveBeenCalledWith({
        where: { id: 'fulfillment-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException for invalid id', async () => {
      prisma.fulfillment.findUnique.mockResolvedValue(null);

      await expect(service.getFulfillment('invalid-id', brandId)).rejects.toThrow(NotFoundException);
      await expect(service.getFulfillment('invalid-id', brandId)).rejects.toThrow('Fulfillment invalid-id not found');
    });

    it('should throw NotFoundException when brand does not match', async () => {
      prisma.fulfillment.findUnique.mockResolvedValue({ ...mockFulfillment, brandId: 'other-brand' });

      await expect(service.getFulfillment('fulfillment-1', brandId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listFulfillments', () => {
    it('should return filtered list with items and total', async () => {
      const items = [mockFulfillment];
      prisma.fulfillment.findMany.mockResolvedValue(items);
      prisma.fulfillment.count.mockResolvedValue(1);

      const result = await service.listFulfillments(brandId, { limit: 20, offset: 0 });

      expect(result).toEqual({ items, total: 1 });
      expect(prisma.fulfillment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId },
          take: 20,
          skip: 0,
          orderBy: { updatedAt: 'desc' },
        }),
      );
      expect(prisma.fulfillment.count).toHaveBeenCalledWith({ where: { brandId } });
    });

    it('should apply status filter when provided', async () => {
      prisma.fulfillment.findMany.mockResolvedValue([]);
      prisma.fulfillment.count.mockResolvedValue(0);

      await service.listFulfillments(brandId, { status: FulfillmentStatus.SHIPPED, limit: 10, offset: 5 });

      expect(prisma.fulfillment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId, status: FulfillmentStatus.SHIPPED },
          take: 10,
          skip: 5,
        }),
      );
    });
  });

  describe('updateFulfillmentStatus', () => {
    it('should update status in Prisma and emit events for SHIPPED', async () => {
      const updated = { ...mockFulfillment, status: FulfillmentStatus.SHIPPED };
      prisma.fulfillment.findUnique.mockResolvedValue({ ...mockFulfillment, pipeline: {} });
      prisma.fulfillment.update.mockResolvedValue(updated);

      const result = await service.updateFulfillmentStatus('fulfillment-1', brandId, FulfillmentStatus.SHIPPED);

      expect(result).toEqual(updated);
      expect(prisma.fulfillment.update).toHaveBeenCalledWith({
        where: { id: 'fulfillment-1' },
        data: { status: FulfillmentStatus.SHIPPED },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.FULFILLMENT_SHIPPED, expect.any(Object));
    });

    it('should emit FULFILLMENT_DELIVERED when status is DELIVERED', async () => {
      const updated = { ...mockFulfillment, status: FulfillmentStatus.DELIVERED };
      prisma.fulfillment.findUnique.mockResolvedValue({ ...mockFulfillment, pipeline: {} });
      prisma.fulfillment.update.mockResolvedValue(updated);

      await service.updateFulfillmentStatus('fulfillment-1', brandId, FulfillmentStatus.DELIVERED);

      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.FULFILLMENT_DELIVERED, expect.any(Object));
    });
  });

  describe('cancelFulfillment', () => {
    it('should cancel fulfillment and update status to CANCELLED', async () => {
      const pending = { ...mockFulfillment, status: FulfillmentStatus.PENDING, pipeline: {} };
      const cancelled = { ...mockFulfillment, status: FulfillmentStatus.CANCELLED };
      prisma.fulfillment.findUnique.mockResolvedValue(pending);
      prisma.fulfillment.update.mockResolvedValue(cancelled);

      const result = await service.cancelFulfillment('fulfillment-1', brandId);

      expect(result.status).toBe(FulfillmentStatus.CANCELLED);
      expect(prisma.fulfillment.update).toHaveBeenCalledWith({
        where: { id: 'fulfillment-1' },
        data: { status: FulfillmentStatus.CANCELLED },
      });
    });

    it('should throw BadRequestException when status is not cancellable', async () => {
      const shipped = { ...mockFulfillment, status: FulfillmentStatus.SHIPPED, pipeline: {} };
      prisma.fulfillment.findUnique.mockResolvedValue(shipped);

      await expect(service.cancelFulfillment('fulfillment-1', brandId)).rejects.toThrow(BadRequestException);
      await expect(service.cancelFulfillment('fulfillment-1', brandId)).rejects.toThrow('Fulfillment cannot be cancelled');
      expect(prisma.fulfillment.update).not.toHaveBeenCalled();
    });
  });

  describe('markAsShipped', () => {
    it('should update status to SHIPPED with tracking info and emit event', async () => {
      const withTracking = {
        ...mockFulfillment,
        status: FulfillmentStatus.SHIPPED,
        carrier: 'DHL',
        trackingNumber: 'TRK123',
        trackingUrl: 'https://track.example/TRK123',
        shippedAt: new Date(),
      };
      prisma.fulfillment.findUnique.mockResolvedValue({ ...mockFulfillment, pipeline: {} });
      prisma.fulfillment.update.mockResolvedValue(withTracking);

      const result = await service.markAsShipped('fulfillment-1', brandId, {
        carrier: 'DHL',
        trackingNumber: 'TRK123',
        trackingUrl: 'https://track.example/TRK123',
      });

      expect(result.status).toBe(FulfillmentStatus.SHIPPED);
      expect(prisma.fulfillment.update).toHaveBeenCalledWith({
        where: { id: 'fulfillment-1' },
        data: expect.objectContaining({
          status: FulfillmentStatus.SHIPPED,
          carrier: 'DHL',
          trackingNumber: 'TRK123',
          trackingUrl: 'https://track.example/TRK123',
          shippedAt: expect.any(Date),
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.FULFILLMENT_SHIPPED, {
        fulfillmentId: 'fulfillment-1',
        orderId: mockFulfillment.orderId,
        trackingNumber: withTracking.trackingNumber,
        trackingUrl: withTracking.trackingUrl,
      });
    });
  });

  describe('markAsDelivered', () => {
    it('should update status to DELIVERED and emit FULFILLMENT_DELIVERED', async () => {
      const delivered = {
        ...mockFulfillment,
        status: FulfillmentStatus.DELIVERED,
        deliveredAt: new Date(),
      };
      prisma.fulfillment.findUnique.mockResolvedValue({ ...mockFulfillment, pipeline: {} });
      prisma.fulfillment.update.mockResolvedValue(delivered);

      const result = await service.markAsDelivered('fulfillment-1', brandId);

      expect(result.status).toBe(FulfillmentStatus.DELIVERED);
      expect(prisma.fulfillment.update).toHaveBeenCalledWith({
        where: { id: 'fulfillment-1' },
        data: expect.objectContaining({
          status: FulfillmentStatus.DELIVERED,
          deliveredAt: expect.any(Date),
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.FULFILLMENT_DELIVERED, {
        fulfillmentId: 'fulfillment-1',
        orderId: mockFulfillment.orderId,
      });
    });
  });
});
