import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ManufacturingOrchestratorService } from '@/modules/production-commerce-engine/manufacturing/services/manufacturing-orchestrator.service';
import { ProviderManagerService } from '@/modules/production-commerce-engine/manufacturing/services/provider-manager.service';
import { CostCalculatorService } from '@/modules/production-commerce-engine/manufacturing/services/cost-calculator.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ProductionOrderStatus } from '@prisma/client';
import { PCE_EVENTS } from '@/modules/production-commerce-engine/pce.constants';

describe('ManufacturingOrchestratorService', () => {
  let service: ManufacturingOrchestratorService;
  let prisma: {
    productionOrder: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock; count: jest.Mock };
  };
  let providerManager: { getProvider: jest.Mock; getAvailableProviders: jest.Mock; getProviderInstance: jest.Mock; selectOptimalProvider: jest.Mock };
  let costCalculator: { calculateProductionCost: jest.Mock; calculateShippingCost: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  const brandId = 'brand-1';
  const orderId = 'order-1';
  const items = [{ productId: 'prod-1', quantity: 2, variantId: 'v1' }];
  const shippingAddress = {
    name: 'John Doe',
    address1: '123 Main St',
    city: 'Paris',
    state: 'IDF',
    zip: '75001',
    country: 'FR',
  };
  const mockProductionOrder = {
    id: 'po-1',
    brandId,
    orderId,
    providerId: 'printful',
    externalOrderId: 'ext-123',
    status: ProductionOrderStatus.SUBMITTED,
    trackingNumber: null,
    trackingUrl: null,
    submittedAt: new Date(),
    completedAt: null,
    items: items as object,
    shippingAddress: shippingAddress as object,
    costs: { itemsCost: 1000, shippingCost: 500, currency: 'EUR' } as object,
    statusHistory: [] as object,
    metadata: {} as object,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockProviderInstance = {
    createOrder: jest.fn().mockResolvedValue({ externalOrderId: 'ext-123', status: ProductionOrderStatus.SUBMITTED }),
    getOrderStatus: jest.fn().mockResolvedValue({ status: 'IN_PRODUCTION', trackingNumber: null, trackingUrl: null, completedAt: null, error: null }),
    cancelOrder: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    prisma = {
      productionOrder: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };
    providerManager = {
      getProvider: jest.fn(),
      getAvailableProviders: jest.fn().mockResolvedValue([{ id: 'printful', name: 'Printful' }]),
      getProviderInstance: jest.fn().mockResolvedValue(mockProviderInstance),
      selectOptimalProvider: jest.fn().mockResolvedValue({ id: 'printful', name: 'Printful' }),
    };
    costCalculator = {
      calculateProductionCost: jest.fn().mockResolvedValue({
        itemsCost: 1000,
        currency: 'EUR',
        breakdown: [{ productId: 'prod-1', quantity: 2, unitCost: 500, total: 1000, currency: 'EUR' }],
      }),
      calculateShippingCost: jest.fn().mockResolvedValue({ cost: 500, currency: 'EUR' }),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManufacturingOrchestratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProviderManagerService, useValue: providerManager },
        { provide: CostCalculatorService, useValue: costCalculator },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(ManufacturingOrchestratorService);
    mockProviderInstance.createOrder.mockResolvedValue({ externalOrderId: 'ext-123', status: ProductionOrderStatus.SUBMITTED });
    mockProviderInstance.getOrderStatus.mockResolvedValue({ status: 'IN_PRODUCTION', trackingNumber: null, trackingUrl: null, completedAt: null, error: null });
    mockProviderInstance.cancelOrder.mockResolvedValue(undefined);
  });

  describe('createProductionOrder', () => {
    it('should create production order and submit to provider', async () => {
      prisma.productionOrder.create.mockResolvedValue(mockProductionOrder);
      prisma.productionOrder.update.mockResolvedValue({
        ...mockProductionOrder,
        externalOrderId: 'ext-123',
        status: ProductionOrderStatus.SUBMITTED,
      });

      const result = await service.createProductionOrder({
        brandId,
        orderId,
        items,
        shippingAddress,
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: 'po-1',
          externalOrderId: 'ext-123',
          status: ProductionOrderStatus.SUBMITTED,
        }),
      );
      expect(prisma.productionOrder.create).toHaveBeenCalled();
      expect(mockProviderInstance.createOrder).toHaveBeenCalledWith(items, shippingAddress, expect.objectContaining({ externalId: 'po-1' }));
      expect(providerManager.selectOptimalProvider).toHaveBeenCalledWith(brandId);
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.PRODUCTION_SUBMITTED, expect.objectContaining({
        productionOrderId: 'po-1',
        orderId,
        brandId,
        externalOrderId: 'ext-123',
        providerId: 'printful',
      }));
    });

    it('should use specified providerId when provided', async () => {
      providerManager.getProvider.mockResolvedValue({ id: 'gelato', name: 'Gelato' });
      prisma.productionOrder.create.mockResolvedValue({ ...mockProductionOrder, id: 'po-2', providerId: 'gelato' });
      prisma.productionOrder.update.mockResolvedValue({ ...mockProductionOrder, providerId: 'gelato', externalOrderId: 'ext-456', status: ProductionOrderStatus.SUBMITTED });

      await service.createProductionOrder({
        brandId,
        orderId,
        items,
        shippingAddress,
        providerId: 'gelato',
      });

      expect(providerManager.getProvider).toHaveBeenCalledWith('gelato');
      expect(providerManager.selectOptimalProvider).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no provider available', async () => {
      providerManager.selectOptimalProvider.mockResolvedValue(null);

      await expect(
        service.createProductionOrder({ brandId, orderId, items, shippingAddress }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createProductionOrder({ brandId, orderId, items, shippingAddress }),
      ).rejects.toThrow('No POD provider available');
      expect(prisma.productionOrder.create).not.toHaveBeenCalled();
    });

    it('should update order to FAILED and emit PRODUCTION_FAILED when provider submit throws', async () => {
      prisma.productionOrder.create.mockResolvedValue(mockProductionOrder);
      mockProviderInstance.createOrder.mockRejectedValueOnce(new Error('Provider error'));
      prisma.productionOrder.update.mockResolvedValue({ ...mockProductionOrder, status: ProductionOrderStatus.FAILED });

      await expect(
        service.createProductionOrder({ brandId, orderId, items, shippingAddress }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.productionOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'po-1' },
          data: expect.objectContaining({ status: ProductionOrderStatus.FAILED }),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.PRODUCTION_FAILED, expect.any(Object));
    });
  });

  describe('getProductionOrderStatus', () => {
    it('should return status from DB when no external order', async () => {
      const order = { ...mockProductionOrder, externalOrderId: null, providerId: 'printful', provider: {} };
      prisma.productionOrder.findUnique.mockResolvedValue(order);

      const result = await service.getProductionOrderStatus('po-1');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'po-1',
          status: ProductionOrderStatus.SUBMITTED,
          externalOrderId: null,
          trackingNumber: null,
          trackingUrl: null,
        }),
      );
      expect(mockProviderInstance.getOrderStatus).not.toHaveBeenCalled();
    });

    it('should fetch from provider and update DB when remote status differs', async () => {
      const order = {
        ...mockProductionOrder,
        externalOrderId: 'ext-123',
        providerId: 'printful',
        provider: {},
        trackingNumber: null,
        trackingUrl: null,
      };
      prisma.productionOrder.findUnique.mockResolvedValue(order);
      prisma.productionOrder.update.mockResolvedValue({
        ...order,
        status: 'IN_PRODUCTION',
        trackingNumber: 'TRK1',
        trackingUrl: 'https://track/TRK1',
      });
      mockProviderInstance.getOrderStatus.mockResolvedValue({
        status: 'IN_PRODUCTION',
        trackingNumber: 'TRK1',
        trackingUrl: 'https://track/TRK1',
        completedAt: null,
        error: null,
      });

      const result = await service.getProductionOrderStatus('po-1');

      expect(result.status).toBe('IN_PRODUCTION');
      expect(result.trackingNumber).toBe('TRK1');
      expect(mockProviderInstance.getOrderStatus).toHaveBeenCalledWith('ext-123');
      expect(prisma.productionOrder.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when production order not found', async () => {
      prisma.productionOrder.findUnique.mockResolvedValue(null);

      await expect(service.getProductionOrderStatus('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.getProductionOrderStatus('invalid-id')).rejects.toThrow('Production order not found');
    });
  });

  describe('cancelProductionOrder', () => {
    it('should cancel with provider and update status to CANCELLED', async () => {
      const order = { ...mockProductionOrder, externalOrderId: 'ext-123', providerId: 'printful', statusHistory: [] };
      prisma.productionOrder.findUnique.mockResolvedValue(order);
      prisma.productionOrder.update.mockResolvedValue({ ...order, status: ProductionOrderStatus.CANCELLED });

      const result = await service.cancelProductionOrder('po-1');

      expect(result).toEqual({ id: 'po-1', status: ProductionOrderStatus.CANCELLED });
      expect(mockProviderInstance.cancelOrder).toHaveBeenCalledWith('ext-123');
      expect(prisma.productionOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'po-1' },
          data: expect.objectContaining({ status: ProductionOrderStatus.CANCELLED }),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.PRODUCTION_FAILED, expect.objectContaining({ productionOrderId: 'po-1', error: 'Cancelled' }));
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.productionOrder.findUnique.mockResolvedValue(null);

      await expect(service.cancelProductionOrder('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order already CANCELLED', async () => {
      prisma.productionOrder.findUnique.mockResolvedValue({ ...mockProductionOrder, status: ProductionOrderStatus.CANCELLED });

      await expect(service.cancelProductionOrder('po-1')).rejects.toThrow(BadRequestException);
      await expect(service.cancelProductionOrder('po-1')).rejects.toThrow('cannot be cancelled');
      expect(prisma.productionOrder.update).not.toHaveBeenCalled();
    });
  });

  describe('getQuotes', () => {
    it('should return quotes from providers', async () => {
      const quotes = await service.getQuotes({
        brandId,
        items,
        shippingAddress,
      });

      expect(Array.isArray(quotes)).toBe(true);
      expect(providerManager.getAvailableProviders).toHaveBeenCalledWith(brandId);
      expect(costCalculator.calculateProductionCost).toHaveBeenCalled();
      expect(costCalculator.calculateShippingCost).toHaveBeenCalled();
      if (quotes.length > 0) {
        expect(quotes[0]).toEqual(
          expect.objectContaining({
            providerId: expect.any(String),
            providerName: expect.any(String),
            items: expect.any(Array),
            shippingCost: expect.any(Number),
            totalCost: expect.any(Number),
            currency: expect.any(String),
            validUntil: expect.any(Date),
          }),
        );
      }
    });

    it('should get quote from single provider when providerId specified', async () => {
      providerManager.getProvider.mockResolvedValue({ id: 'gelato', name: 'Gelato' });

      await service.getQuotes({
        brandId,
        items,
        shippingAddress,
        providerId: 'gelato',
      });

      expect(providerManager.getProvider).toHaveBeenCalledWith('gelato');
      expect(providerManager.getAvailableProviders).not.toHaveBeenCalled();
    });
  });
});
