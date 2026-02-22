import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';
import { ReturnService } from '@/modules/production-commerce-engine/fulfillment/services/return.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ReturnStatus, RefundStatus } from '@prisma/client';
import { PCE_EVENTS } from '@/modules/production-commerce-engine/pce.constants';

describe('ReturnService', () => {
  let service: ReturnService;
  let prisma: {
    return: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock; count: jest.Mock };
  };
  let eventEmitter: { emit: jest.Mock };

  const brandId = 'brand-1';
  const mockReturn = {
    id: 'return-1',
    brandId,
    orderId: 'order-1',
    fulfillmentId: null,
    reason: 'Defective',
    reasonDetails: null,
    items: [{ lineItemId: 'li-1', quantity: 1 }],
    notes: null,
    status: ReturnStatus.REQUESTED,
    refundStatus: null,
    refundAmountCents: null,
    refundedAt: null,
    receivedAt: null,
    inspectedAt: null,
    returnLabel: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      return: {
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
        ReturnService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(ReturnService);
  });

  describe('createReturn', () => {
    it('should create return request and emit RETURN_REQUESTED event', async () => {
      prisma.return.create.mockResolvedValue(mockReturn);

      const params = {
        orderId: 'order-1',
        reason: 'Defective',
        items: [{ lineItemId: 'li-1', quantity: 1 }],
      };

      const result = await service.createReturn(brandId, params);

      expect(result).toEqual(mockReturn);
      expect(prisma.return.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          brandId,
          orderId: params.orderId,
          reason: params.reason,
          items: params.items as object,
          status: ReturnStatus.REQUESTED,
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.RETURN_REQUESTED, {
        returnId: mockReturn.id,
        orderId: mockReturn.orderId,
        brandId,
      });
    });
  });

  describe('getReturn', () => {
    it('should return return when found and brand matches', async () => {
      prisma.return.findUnique.mockResolvedValue(mockReturn);

      const result = await service.getReturn('return-1', brandId);

      expect(result).toEqual(mockReturn);
      expect(prisma.return.findUnique).toHaveBeenCalledWith({ where: { id: 'return-1' } });
    });

    it('should throw NotFoundException when return not found', async () => {
      prisma.return.findUnique.mockResolvedValue(null);

      await expect(service.getReturn('invalid-id', brandId)).rejects.toThrow(NotFoundException);
      await expect(service.getReturn('invalid-id', brandId)).rejects.toThrow('Return invalid-id not found');
    });

    it('should throw NotFoundException when brand does not match', async () => {
      prisma.return.findUnique.mockResolvedValue({ ...mockReturn, brandId: 'other-brand' });

      await expect(service.getReturn('return-1', brandId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listReturns', () => {
    it('should return items and total with optional filters', async () => {
      const items = [mockReturn];
      prisma.return.findMany.mockResolvedValue(items);
      prisma.return.count.mockResolvedValue(1);

      const result = await service.listReturns(brandId, { limit: 20, offset: 0 });

      expect(result).toEqual({ items, total: 1 });
      expect(prisma.return.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId },
          take: 20,
          skip: 0,
          orderBy: { updatedAt: 'desc' },
        }),
      );
      expect(prisma.return.count).toHaveBeenCalledWith({ where: { brandId } });
    });

    it('should apply status filter when provided', async () => {
      prisma.return.findMany.mockResolvedValue([]);
      prisma.return.count.mockResolvedValue(0);

      await service.listReturns(brandId, { status: ReturnStatus.APPROVED, limit: 10, offset: 5 });

      expect(prisma.return.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId, status: ReturnStatus.APPROVED },
          take: 10,
          skip: 5,
        }),
      );
    });
  });

  describe('processReturn', () => {
    it('should approve return and emit RETURN_APPROVED', async () => {
      const updated = { ...mockReturn, status: ReturnStatus.APPROVED };
      prisma.return.findUnique.mockResolvedValue(mockReturn);
      prisma.return.update.mockResolvedValue(updated);

      const result = await service.processReturn('return-1', brandId, ReturnStatus.APPROVED, 'Approved by support');

      expect(result).toEqual(updated);
      expect(prisma.return.update).toHaveBeenCalledWith({
        where: { id: 'return-1' },
        data: expect.objectContaining({
          status: ReturnStatus.APPROVED,
          notes: 'Approved by support',
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.RETURN_APPROVED, {
        returnId: 'return-1',
        orderId: mockReturn.orderId,
        brandId,
      });
    });

    it('should set receivedAt when action is RECEIVED and emit RETURN_RECEIVED', async () => {
      const updated = { ...mockReturn, status: ReturnStatus.RECEIVED, receivedAt: new Date() };
      prisma.return.findUnique.mockResolvedValue(mockReturn);
      prisma.return.update.mockResolvedValue(updated);

      await service.processReturn('return-1', brandId, ReturnStatus.RECEIVED);

      expect(prisma.return.update).toHaveBeenCalledWith({
        where: { id: 'return-1' },
        data: expect.objectContaining({
          status: ReturnStatus.RECEIVED,
          receivedAt: expect.any(Date),
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.RETURN_RECEIVED, expect.any(Object));
    });

    it('should reject when invalid return id', async () => {
      prisma.return.findUnique.mockResolvedValue(null);

      await expect(service.processReturn('invalid-id', brandId, ReturnStatus.APPROVED)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsReceived', () => {
    it('should delegate to processReturn with RECEIVED', async () => {
      const updated = { ...mockReturn, status: ReturnStatus.RECEIVED };
      prisma.return.findUnique.mockResolvedValue(mockReturn);
      prisma.return.update.mockResolvedValue(updated);

      const result = await service.markAsReceived('return-1', brandId);

      expect(result.status).toBe(ReturnStatus.RECEIVED);
      expect(prisma.return.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'return-1' },
          data: expect.objectContaining({ status: ReturnStatus.RECEIVED }),
        }),
      );
    });
  });

  describe('processRefund', () => {
    it('should calculate refund, update status to REFUNDED and emit RETURN_REFUNDED', async () => {
      const updated = {
        ...mockReturn,
        status: ReturnStatus.REFUNDED,
        refundStatus: RefundStatus.FULL,
        refundAmountCents: 5000,
        refundedAt: new Date(),
      };
      prisma.return.findUnique.mockResolvedValue(mockReturn);
      prisma.return.update.mockResolvedValue(updated);

      const result = await service.processRefund('return-1', brandId, 5000, 'Full refund');

      expect(result).toEqual(updated);
      expect(prisma.return.update).toHaveBeenCalledWith({
        where: { id: 'return-1' },
        data: expect.objectContaining({
          refundStatus: RefundStatus.FULL,
          refundAmountCents: 5000,
          status: ReturnStatus.REFUNDED,
          refundedAt: expect.any(Date),
          notes: 'Full refund',
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.RETURN_REFUNDED, {
        returnId: 'return-1',
        orderId: mockReturn.orderId,
        brandId,
        refundAmountCents: 5000,
      });
    });

    it('should set refundStatus to REJECTED when refundAmountCents <= 0', async () => {
      const updated = {
        ...mockReturn,
        status: ReturnStatus.REFUNDED,
        refundStatus: RefundStatus.REJECTED,
        refundAmountCents: 0,
        refundedAt: new Date(),
      };
      prisma.return.findUnique.mockResolvedValue(mockReturn);
      prisma.return.update.mockResolvedValue(updated);

      await service.processRefund('return-1', brandId, 0);

      expect(prisma.return.update).toHaveBeenCalledWith({
        where: { id: 'return-1' },
        data: expect.objectContaining({
          refundStatus: RefundStatus.REJECTED,
          refundAmountCents: 0,
          status: ReturnStatus.REFUNDED,
        }),
      });
    });
  });
});
