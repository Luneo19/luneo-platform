import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { CreditsService } from '@/libs/credits/credits.service';
import { Decimal } from '@prisma/client/runtime/library';

const mockPurchase = {
  id: 'purchase-1',
  itemId: 'item-1',
  buyerId: 'buyer-1',
  price: new Decimal(10),
  currency: 'CHF',
  status: 'COMPLETED',
  item: { id: 'item-1', title: 'Item' },
  buyer: { id: 'buyer-1', name: 'Buyer' },
};

const mockPrisma = {
  marketplaceItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  marketplacePurchase: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  marketplaceReview: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    aggregate: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockCloudinary = {};
const mockCreditsService = {
  deductCreditsByAmount: jest.fn(),
};

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockResolvedValue([mockPurchase, {}]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: CreditsService, useValue: mockCreditsService },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listItems', () => {
    it('should return paginated items with filters', async () => {
      const items = [
        {
          id: 'item-1',
          title: 'Item 1',
          isActive: true,
          seller: { id: 's-1', name: 'Seller', logo: null },
          _count: { reviews: 2, purchases: 5 },
        },
      ];
      mockPrisma.marketplaceItem.findMany.mockResolvedValue(items);
      mockPrisma.marketplaceItem.count.mockResolvedValue(1);

      const result = await service.listItems({
        type: 'TEMPLATE',
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        items,
        total: 1,
        page: 1,
        limit: 20,
        pages: 1,
      });
      expect(mockPrisma.marketplaceItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true, type: 'TEMPLATE' }),
          skip: 0,
          take: 20,
        }),
      );
      expect(mockPrisma.marketplaceItem.count).toHaveBeenCalled();
    });
  });

  describe('getItem', () => {
    it('should return item when found', async () => {
      const item = {
        id: 'item-1',
        title: 'Item',
        isActive: true,
        seller: { id: 's-1', name: 'Seller', logo: null },
        reviews: [],
        _count: { reviews: 0, purchases: 0 },
      };
      mockPrisma.marketplaceItem.findFirst.mockResolvedValue(item);

      const result = await service.getItem('item-1');

      expect(result).toEqual(item);
      expect(mockPrisma.marketplaceItem.findFirst).toHaveBeenCalledWith({
        where: { id: 'item-1', isActive: true },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when item is missing', async () => {
      mockPrisma.marketplaceItem.findFirst.mockResolvedValue(null);

      await expect(service.getItem('missing-id')).rejects.toThrow(NotFoundException);
      await expect(service.getItem('missing-id')).rejects.toThrow('Marketplace item not found');
    });
  });

  describe('purchaseItem', () => {
    it('should deduct credits and create purchase record on success', async () => {
      const item = {
        id: 'item-1',
        sellerId: 'seller-1',
        buyerId: null,
        price: new Decimal(10),
        currency: 'CHF',
        isActive: true,
      };
      mockPrisma.marketplaceItem.findFirst.mockResolvedValue(item);
      mockCreditsService.deductCreditsByAmount.mockResolvedValue({ success: true });
      mockPrisma.marketplacePurchase.create.mockResolvedValue(mockPurchase);
      mockPrisma.marketplaceItem.update.mockResolvedValue({});

      const result = await service.purchaseItem('item-1', 'buyer-1');

      expect(result).toEqual(mockPurchase);
      expect(mockCreditsService.deductCreditsByAmount).toHaveBeenCalledWith(
        'buyer-1',
        10,
        'marketplace_purchase',
        { itemId: 'item-1' },
      );
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.marketplacePurchase.create).toHaveBeenCalled();
      expect(mockPrisma.marketplaceItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { downloads: { increment: 1 } },
      });
    });

    it('should fail when insufficient credits', async () => {
      const item = {
        id: 'item-1',
        sellerId: 'seller-1',
        price: new Decimal(100),
        currency: 'CHF',
        isActive: true,
      };
      mockPrisma.marketplaceItem.findFirst.mockResolvedValue(item);
      mockCreditsService.deductCreditsByAmount.mockRejectedValue(
        new BadRequestException('Insufficient credits. Required: 100, Available: 5'),
      );

      await expect(service.purchaseItem('item-1', 'buyer-1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.marketplacePurchase.create).not.toHaveBeenCalled();
    });

    it('should fail when trying to buy own item', async () => {
      const item = {
        id: 'item-1',
        sellerId: 'seller-1',
        price: new Decimal(10),
        currency: 'CHF',
        isActive: true,
      };
      mockPrisma.marketplaceItem.findFirst.mockResolvedValue(item);

      await expect(service.purchaseItem('item-1', 'seller-1')).rejects.toThrow(ForbiddenException);
      await expect(service.purchaseItem('item-1', 'seller-1')).rejects.toThrow(
        'Cannot purchase your own item',
      );
      expect(mockCreditsService.deductCreditsByAmount).not.toHaveBeenCalled();
    });
  });

  describe('reviewItem', () => {
    it('should create review with rating and comment', async () => {
      const item = { id: 'item-1', sellerId: 's-1' };
      const purchase = { itemId: 'item-1', buyerId: 'buyer-1', status: 'COMPLETED' };
      const review = {
        id: 'review-1',
        itemId: 'item-1',
        buyerId: 'buyer-1',
        rating: 5,
        comment: 'Great!',
        buyer: { id: 'buyer-1', name: 'Buyer' },
      };

      mockPrisma.marketplaceItem.findFirst.mockResolvedValue(item);
      mockPrisma.marketplacePurchase.findFirst.mockResolvedValue(purchase);
      mockPrisma.marketplaceReview.upsert.mockResolvedValue(review);
      mockPrisma.marketplaceReview.findMany.mockResolvedValue([{ rating: 5 }]);
      mockPrisma.marketplaceItem.update.mockResolvedValue({});
      mockPrisma.marketplaceReview.findUnique.mockResolvedValue(review);

      const result = await service.reviewItem('item-1', 'buyer-1', 5, 'Great!');

      expect(result).toEqual(review);
      expect(mockPrisma.marketplaceReview.upsert).toHaveBeenCalledWith({
        where: { itemId_buyerId: { itemId: 'item-1', buyerId: 'buyer-1' } },
        create: { itemId: 'item-1', buyerId: 'buyer-1', rating: 5, comment: 'Great!' },
        update: { rating: 5, comment: 'Great!' },
      });
      expect(mockPrisma.marketplaceReview.findMany).toHaveBeenCalledWith({
        where: { itemId: 'item-1' },
        select: { rating: true },
        take: 50,
      });
    });
  });
});
