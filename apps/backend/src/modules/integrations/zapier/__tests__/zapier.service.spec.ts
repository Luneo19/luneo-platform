import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { BadRequestException } from '@nestjs/common';
import { ZapierService, ZAPIER_ACTIONS } from '../zapier.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ZAPIER_TRIGGERS } from '../dto/zapier-subscribe.dto';

describe('ZapierService', () => {
  let service: ZapierService;
  let httpService: jest.Mocked<HttpService>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mockHttp = { post: jest.fn(), get: jest.fn() };
    const mockPrisma = {
      webhookSubscription: { create: jest.fn(), deleteMany: jest.fn(), findMany: jest.fn() },
      product: { findFirst: jest.fn() },
      design: { create: jest.fn() },
      brand: { findUnique: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZapierService,
        { provide: HttpService, useValue: mockHttp },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ZapierService>(ZapierService);
    httpService = module.get(HttpService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerWebhook', () => {
    it('should create subscription', async () => {
      (prisma.webhookSubscription.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        brandId: 'brand-1',
        event: 'new_design',
        targetUrl: 'https://hooks.zapier.com/xxx',
        isActive: true,
      });
      const result = await service.registerWebhook('brand-1', 'new_design', 'https://hooks.zapier.com/xxx');
      expect(prisma.webhookSubscription.create).toHaveBeenCalledWith({
        data: { brandId: 'brand-1', event: 'new_design', targetUrl: 'https://hooks.zapier.com/xxx', isActive: true },
      });
      expect(result.id).toBe('sub-1');
    });
  });

  describe('unregisterWebhook', () => {
    it('should delete subscription', async () => {
      (prisma.webhookSubscription.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      await service.unregisterWebhook('brand-1', 'sub-1');
      expect(prisma.webhookSubscription.deleteMany).toHaveBeenCalledWith({
        where: { id: 'sub-1', brandId: 'brand-1' },
      });
    });
    it('should throw when subscription not found', async () => {
      (prisma.webhookSubscription.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      await expect(service.unregisterWebhook('brand-1', 'sub-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('triggerEvent', () => {
    it('should send HTTP POST to registered URLs', async () => {
      (prisma.webhookSubscription.findMany as jest.Mock).mockResolvedValue([
        { id: 'sub-1', targetUrl: 'https://hooks.zapier.com/hooks/catch/1/xxx', isActive: true },
      ]);
      (httpService.post as jest.Mock).mockReturnValue(of({ status: 200 }));
      await service.triggerEvent('brand-1', 'new_design', { designId: 'design-1', name: 'Test' });
      expect(httpService.post).toHaveBeenCalledWith(
        'https://hooks.zapier.com/hooks/catch/1/xxx',
        expect.objectContaining({ event: 'new_design', data: expect.any(Object) }),
        expect.any(Object),
      );
    });
    it('should do nothing when no subscriptions', async () => {
      (prisma.webhookSubscription.findMany as jest.Mock).mockResolvedValue([]);
      await service.triggerEvent('brand-1', 'new_design', {});
      expect(httpService.post).not.toHaveBeenCalled();
    });
  });

  describe('performAction', () => {
    it("performAction('create_design', data) should create a design", async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: 'prod-1', brandId: 'brand-1', isActive: true });
      (prisma.design.create as jest.Mock).mockResolvedValue({
        id: 'design-1',
        name: 'Zapier design',
        status: 'PENDING',
        productId: 'prod-1',
        createdAt: new Date(),
      });
      const result = await service.performAction('brand-1', 'create_design', {
        productId: 'prod-1',
        prompt: 'A blue shoe',
        name: 'Zapier design',
      });
      expect(prisma.design.create).toHaveBeenCalled();
      expect(result.id).toBe('design-1');
    });
  });

  describe('getTriggerSample', () => {
    it("getTriggerSample('new_design') should return sample data", () => {
      const sample = service.getTriggerSample('new_design');
      expect(Array.isArray(sample)).toBe(true);
      expect(sample.length).toBeGreaterThanOrEqual(0);
    });
  });
});
