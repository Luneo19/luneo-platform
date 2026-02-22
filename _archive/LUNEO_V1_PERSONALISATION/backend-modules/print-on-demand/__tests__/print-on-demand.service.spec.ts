import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrintOnDemandService } from '../print-on-demand.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PrintfulProvider } from '../providers/printful.provider';
import { PrintifyProvider } from '../providers/printify.provider';
import { GelatoProvider } from '../providers/gelato.provider';
import type { PrintProvider, PrintOrderItem, ShippingAddress } from '../interfaces/print-provider.interface';

describe('PrintOnDemandService', () => {
  let service: PrintOnDemandService;
  let prisma: jest.Mocked<PrismaService>;
  let printfulProvider: jest.Mocked<PrintProvider>;
  let printifyProvider: jest.Mocked<PrintProvider>;
  let gelatoProvider: jest.Mocked<PrintProvider>;

  const mockPrintful: PrintProvider = {
    name: 'printful',
    getProducts: jest.fn(),
    getProductById: jest.fn(),
    createOrder: jest.fn(),
    getOrderStatus: jest.fn(),
    cancelOrder: jest.fn(),
    getMockup: jest.fn(),
  };

  const mockPrintify: PrintProvider = {
    name: 'printify',
    getProducts: jest.fn(),
    getProductById: jest.fn(),
    createOrder: jest.fn(),
    getOrderStatus: jest.fn(),
    cancelOrder: jest.fn(),
    getMockup: jest.fn(),
  };

  const mockGelato: PrintProvider = {
    name: 'gelato',
    getProducts: jest.fn(),
    getProductById: jest.fn(),
    createOrder: jest.fn(),
    getOrderStatus: jest.fn(),
    cancelOrder: jest.fn(),
    getMockup: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockPrisma = {
      printOrder: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrintOnDemandService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrintfulProvider, useValue: mockPrintful },
        { provide: PrintifyProvider, useValue: mockPrintify },
        { provide: GelatoProvider, useValue: mockGelato },
      ],
    }).compile();

    service = module.get<PrintOnDemandService>(PrintOnDemandService);
    prisma = module.get(PrismaService);
    printfulProvider = module.get(PrintfulProvider);
    printifyProvider = module.get(PrintifyProvider);
    gelatoProvider = module.get(GelatoProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProvider', () => {
    it("should return PrintfulProvider for 'printful'", () => {
      const provider = service.getProvider('printful');
      expect(provider).toBe(printfulProvider);
      expect(provider.name).toBe('printful');
    });

    it("should return PrintifyProvider for 'printify'", () => {
      const provider = service.getProvider('printify');
      expect(provider).toBe(printifyProvider);
      expect(provider.name).toBe('printify');
    });

    it("should return GelatoProvider for 'gelato'", () => {
      const provider = service.getProvider('gelato');
      expect(provider).toBe(gelatoProvider);
      expect(provider.name).toBe('gelato');
    });

    it('should be case-insensitive', () => {
      expect(service.getProvider('PRINTFUL')).toBe(printfulProvider);
      expect(service.getProvider('Printify')).toBe(printifyProvider);
    });

    it("should throw BadRequestException for unknown provider", () => {
      expect(() => service.getProvider('unknown')).toThrow(BadRequestException);
      expect(() => service.getProvider('unknown')).toThrow(/Unknown print provider/);
    });
  });

  describe('calculatePricing', () => {
    it('should return correct provider cost, Luneo margin (10%), and brand margin', async () => {
      (printfulProvider.getProductById as jest.Mock).mockResolvedValue({
        id: '1',
        variants: [
          { id: 'v1', price: 1000 },
        ],
      });

      const items = [
        { productId: '1', variantId: 'v1', quantity: 2 },
      ];

      const result = await service.calculatePricing(items, 'printful', 15);

      expect(result.providerCost).toBe(2000);
      expect(result.luneoMargin).toBe(200);
      expect(result.brandMargin).toBe(300);
      expect(result.totalPrice).toBe(2500);
      expect(result.currency).toBe('EUR');
    });

    it('should use unitPriceCents when provided', async () => {
      const items = [
        { productId: '1', variantId: 'v1', quantity: 1, unitPriceCents: 500 },
      ];

      const result = await service.calculatePricing(items, 'printful', 0);

      expect(printfulProvider.getProductById).not.toHaveBeenCalled();
      expect(result.providerCost).toBe(500);
      expect(result.luneoMargin).toBe(50);
      expect(result.brandMargin).toBe(0);
      expect(result.totalPrice).toBe(550);
    });
  });

  describe('createPrintOrder', () => {
    const items: PrintOrderItem[] = [
      { productId: '1', variantId: 'v1', quantity: 1, designUrl: 'https://example.com/art.png' },
    ];
    const shippingAddress: ShippingAddress = {
      name: 'John Doe',
      address1: '123 Main St',
      city: 'Paris',
      country: 'FR',
      zip: '75001',
    };

    it('should create order in DB and call provider', async () => {
      (printfulProvider.getProductById as jest.Mock).mockResolvedValue({
        id: '1',
        variants: [{ id: 'v1', price: 1000 }],
      });
      (printfulProvider.createOrder as jest.Mock).mockResolvedValue({
        providerId: 'printful',
        providerOrderId: 'pf-123',
        status: 'pending',
        estimatedDelivery: new Date(),
      });

      (prisma.printOrder.create as jest.Mock).mockResolvedValue({
        id: 'po-1',
        orderId: 'ord-1',
        provider: 'printful',
        providerOrderId: 'pf-123',
        status: 'pending',
      });

      const result = await service.createPrintOrder(
        'brand-1',
        'ord-1',
        'printful',
        items,
        shippingAddress,
        5,
      );

      expect(printfulProvider.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          externalId: 'ord-1',
          items,
          shippingAddress,
        }),
      );
      expect(prisma.printOrder.create).toHaveBeenCalled();
      expect(result.printOrder).toBeDefined();
      expect(result.providerResult.providerOrderId).toBe('pf-123');
    });
  });

  describe('getOrderStatus', () => {
    it('should return current status from DB when no providerOrderId', async () => {
      (prisma.printOrder.findFirst as jest.Mock).mockResolvedValue({
        id: 'po-1',
        orderId: 'ord-1',
        provider: 'printful',
        providerOrderId: null,
        status: 'draft',
        trackingNumber: null,
        trackingUrl: null,
      });

      const result = await service.getOrderStatus('ord-1');

      expect(result.status).toBe('draft');
      expect(printfulProvider.getOrderStatus).not.toHaveBeenCalled();
    });

    it('should fetch from provider and update DB when providerOrderId exists', async () => {
      (prisma.printOrder.findFirst as jest.Mock).mockResolvedValue({
        id: 'po-1',
        orderId: 'ord-1',
        provider: 'printful',
        providerOrderId: 'pf-123',
        status: 'pending',
        trackingUrl: null,
      });
      (printfulProvider.getOrderStatus as jest.Mock).mockResolvedValue({
        providerOrderId: 'pf-123',
        status: 'shipped',
        trackingUrl: 'https://track.example/1',
      });
      (prisma.printOrder.update as jest.Mock).mockResolvedValue({});

      const result = await service.getOrderStatus('ord-1');

      expect(printfulProvider.getOrderStatus).toHaveBeenCalledWith('pf-123');
      expect(prisma.printOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'po-1' },
          data: { status: 'shipped', trackingUrl: 'https://track.example/1' },
        }),
      );
      expect(result.status).toBe('shipped');
    });

    it('should throw NotFoundException when print order not found', async () => {
      (prisma.printOrder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getOrderStatus('unknown')).rejects.toThrow(NotFoundException);
      await expect(service.getOrderStatus('unknown')).rejects.toThrow(/Print order not found/);
    });
  });
});
