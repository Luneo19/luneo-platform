import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

const mockPrisma = {
  cart: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  cartItem: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart if found', async () => {
      const existingCart = {
        id: 'cart-1',
        userId: 'user-1',
        brandId: 'brand-1',
        items: [
          {
            id: 'ci-1',
            productId: 'prod-1',
            quantity: 2,
            priceCents: 1000,
            designId: null,
            customizationId: null,
            metadata: null,
          },
        ],
        updatedAt: new Date(),
      };
      mockPrisma.cart.findUnique.mockResolvedValue(existingCart);

      const result = await service.getOrCreateCart('user-1', 'brand-1');

      expect(result.id).toBe('cart-1');
      expect(result.brandId).toBe('brand-1');
      expect(result.items).toHaveLength(1);
      expect(result.subtotalCents).toBe(2000);
      expect(result.itemCount).toBe(2);
      expect(mockPrisma.cart.findUnique).toHaveBeenCalledWith({
        where: { userId_brandId: { userId: 'user-1', brandId: 'brand-1' } },
        include: { items: true },
      });
      expect(mockPrisma.cart.create).not.toHaveBeenCalled();
    });

    it('should create new cart if none exists', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);
      const newCart = {
        id: 'cart-new',
        userId: 'user-1',
        brandId: 'brand-1',
        items: [],
        updatedAt: new Date(),
      };
      mockPrisma.cart.create.mockResolvedValue(newCart);

      const result = await service.getOrCreateCart('user-1', 'brand-1');

      expect(result.id).toBe('cart-new');
      expect(result.items).toEqual([]);
      expect(result.subtotalCents).toBe(0);
      expect(result.itemCount).toBe(0);
      expect(mockPrisma.cart.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          brandId: 'brand-1',
        }),
        include: { items: true },
      });
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      const cart = {
        id: 'cart-1',
        userId: 'user-1',
        brandId: 'brand-1',
        updatedAt: new Date(),
      };
      mockPrisma.cart.upsert.mockResolvedValue(cart);
      mockPrisma.cartItem.findFirst.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({});
      mockPrisma.cart.findUnique.mockResolvedValue({
        ...cart,
        items: [
          {
            id: 'ci-1',
            productId: 'prod-1',
            quantity: 1,
            priceCents: 500,
            designId: null,
            customizationId: null,
            metadata: null,
          },
        ],
        updatedAt: cart.updatedAt,
      });

      await service.addItem('user-1', 'brand-1', {
        productId: 'prod-1',
        quantity: 1,
        priceCents: 500,
      });

      expect(mockPrisma.cart.upsert).toHaveBeenCalledWith({
        where: { userId_brandId: { userId: 'user-1', brandId: 'brand-1' } },
        create: expect.any(Object),
        update: expect.any(Object),
      });
      expect(mockPrisma.cartItem.findFirst).toHaveBeenCalled();
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cartId: 'cart-1',
          productId: 'prod-1',
          quantity: 1,
          priceCents: 500,
        }),
      });
      expect(mockPrisma.cartItem.update).not.toHaveBeenCalled();
    });

    it('should update quantity if item already in cart', async () => {
      const cart = {
        id: 'cart-1',
        userId: 'user-1',
        brandId: 'brand-1',
        updatedAt: new Date(),
      };
      const existingItem = {
        id: 'ci-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        quantity: 2,
        priceCents: 500,
        designId: null,
        customizationId: null,
        metadata: null,
      };
      mockPrisma.cart.upsert.mockResolvedValue(cart);
      mockPrisma.cartItem.findFirst.mockResolvedValue(existingItem);
      mockPrisma.cartItem.update.mockResolvedValue({});
      mockPrisma.cart.findUnique.mockResolvedValue({
        ...cart,
        items: [{ ...existingItem, quantity: 5 }],
        updatedAt: cart.updatedAt,
      });

      await service.addItem('user-1', 'brand-1', {
        productId: 'prod-1',
        quantity: 3,
        priceCents: 500,
      });

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'ci-1' },
        data: expect.objectContaining({
          quantity: 5,
          priceCents: 500,
        }),
      });
      expect(mockPrisma.cartItem.create).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const item = {
        id: 'ci-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        quantity: 1,
        priceCents: 500,
        cart: { userId: 'user-1', brandId: 'brand-1' },
      };
      mockPrisma.cartItem.findUnique.mockResolvedValue(item);
      mockPrisma.cartItem.delete.mockResolvedValue({});
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
        brandId: 'brand-1',
        items: [],
        updatedAt: new Date(),
      });

      const result = await service.removeItem('user-1', 'ci-1');

      expect(result.items).toHaveLength(0);
      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'ci-1' } });
    });

    it('should throw NotFoundException when cart item not found or not owned', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(service.removeItem('user-1', 'ci-unknown')).rejects.toThrow(NotFoundException);
      await expect(service.removeItem('user-1', 'ci-unknown')).rejects.toThrow('Cart item not found');
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      const cart = {
        id: 'cart-1',
        userId: 'user-1',
        brandId: 'brand-1',
        updatedAt: new Date(),
      };
      mockPrisma.cart.findUnique
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce({ ...cart, items: [], updatedAt: new Date() });
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.clearCart('user-1', 'brand-1');

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
      expect(result.items).toEqual([]);
      expect(result.subtotalCents).toBe(0);
      expect(result.itemCount).toBe(0);
    });
  });
});
