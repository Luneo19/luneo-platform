import { Test, TestingModule } from '@nestjs/testing';
import { OrderRoutingService } from './order-routing.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('OrderRoutingService', () => {
  let service: OrderRoutingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRoutingService,
        {
          provide: PrismaService,
          useValue: {
            artisan: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            product: {
              findUnique: jest.fn(),
            },
            order: {
              findUnique: jest.fn(),
            },
            quote: {
              create: jest.fn(),
            },
            workOrder: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrderRoutingService>(OrderRoutingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findBestArtisans', () => {
    it('should find artisans matching criteria', async () => {
      const mockArtisans = [
        {
          id: 'artisan-1',
          status: 'active',
          kycStatus: 'verified',
          supportedMaterials: ['gold'],
          supportedTechniques: ['casting'],
          currentLoad: 5,
          maxVolume: 10,
          qualityScore: 4.8,
          onTimeDeliveryRate: 0.95,
          defectRate: 0.02,
          returnRate: 0.01,
          averageLeadTime: 7,
          capabilities: [],
        },
      ];

      jest.spyOn(prisma.artisan, 'findMany').mockResolvedValue(mockArtisans as any);
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue({
        baseCostCents: 5000,
        laborCostCents: 3000,
      } as any);

      const matches = await service.findBestArtisans(
        {
          orderId: 'order-123',
          productId: 'product-456',
          material: 'gold',
          technique: 'casting',
        },
        3,
      );

      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
    });

    it('should filter out artisans at capacity', async () => {
      const mockArtisans = [
        {
          id: 'artisan-1',
          status: 'active',
          kycStatus: 'verified',
          supportedMaterials: ['gold'],
          supportedTechniques: ['casting'],
          currentLoad: 10, // At max capacity
          maxVolume: 10,
          capabilities: [],
        },
      ];

      jest.spyOn(prisma.artisan, 'findMany').mockResolvedValue(mockArtisans as any);

      const matches = await service.findBestArtisans(
        {
          orderId: 'order-123',
          productId: 'product-456',
          material: 'gold',
          technique: 'casting',
        },
        3,
      );

      // Should filter out artisan at capacity
      expect(matches.length).toBe(0);
    });
  });

  describe('routeOrder', () => {
    it('should create work order and quote', async () => {
      jest.spyOn(prisma.order, 'findUnique').mockResolvedValue({
        id: 'order-123',
        productId: 'product-456',
      } as any);

      jest.spyOn(prisma.artisan, 'findUnique').mockResolvedValue({
        id: 'artisan-1',
        currentLoad: 5,
      } as any);

      jest.spyOn(prisma.quote, 'create').mockResolvedValue({
        id: 'quote-1',
      } as any);

      jest.spyOn(prisma.workOrder, 'create').mockResolvedValue({
        id: 'work-order-1',
      } as any);

      jest.spyOn(prisma.artisan, 'update').mockResolvedValue({} as any);

      const result = await service.routeOrder('order-123', 'artisan-1', {
        priceCents: 10000,
        leadTime: 7,
        breakdown: {},
      });

      expect(result.workOrder).toBeDefined();
      expect(result.quote).toBeDefined();
      expect(prisma.artisan.update).toHaveBeenCalledWith({
        where: { id: 'artisan-1' },
        data: { currentLoad: 6 },
      });
    });
  });
});





























