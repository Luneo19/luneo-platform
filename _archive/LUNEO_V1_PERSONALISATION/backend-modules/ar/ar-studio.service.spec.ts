import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ArStudioService } from './ar-studio.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';

describe('ArStudioService', () => {
  let service: ArStudioService;

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    design: {
      findUnique: jest.fn(),
    },
    analyticsEvent: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    orderItem: {
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string): string | undefined => {
      if (key === 'app.frontendUrl') return 'https://app.luneo.io';
      if (key === 'MESHY_API_KEY') return 'test-meshy-key';
      return undefined;
    }),
  };

  const mockStorageService = {
    getSignedUrl: jest.fn().mockResolvedValue('https://signed.example.com/model.glb'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArStudioService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ArStudioService>(ArStudioService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listModels', () => {
    it('should return AR models for a brand', async () => {
      const products = [
        {
          id: 'prod-1',
          name: 'Product 1',
          model3dUrl: 'https://cdn.example.com/model.glb',
          thumbnailUrl: null,
          category: 'footwear',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          modelConfig: null,
          tags: ['tag1'],
        },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(products);
      mockPrismaService.analyticsEvent.count.mockResolvedValue(0);
      mockPrismaService.orderItem.count.mockResolvedValue(0);

      const result = await service.listModels('brand-1');

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId: 'brand-1', model3dUrl: { not: null } },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('prod-1');
      expect(result[0].name).toBe('Product 1');
      expect(result[0].glbUrl).toBe('https://cdn.example.com/model.glb');
      expect(result[0].status).toBe('active');
    });

    it('should throw when prisma fails', async () => {
      mockPrismaService.product.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.listModels('brand-1')).rejects.toThrow('DB error');
    });
  });

  describe('getModelById', () => {
    it('should return model when found', async () => {
      const product = {
        id: 'model-1',
        name: 'AR Model',
        model3dUrl: 'https://cdn.example.com/model.glb',
        thumbnailUrl: null,
        category: 'other',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        modelConfig: null,
        tags: [],
      };
      mockPrismaService.product.findFirst.mockResolvedValue(product);
      mockPrismaService.analyticsEvent.count.mockResolvedValue(5);
      mockPrismaService.orderItem.count.mockResolvedValue(2);

      const result = await service.getModelById('model-1', 'brand-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('model-1');
      expect(result?.viewsCount).toBe(5);
      expect(result?.conversionsCount).toBe(2);
    });

    it('should return null when model not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      const result = await service.getModelById('missing', 'brand-1');

      expect(result).toBeNull();
    });
  });

  describe('generateQRCode', () => {
    it('should return QR code data for existing model', async () => {
      const _model = {
        id: 'model-1',
        name: 'Model',
        type: 'other',
        glbUrl: 'https://cdn.example.com/model.glb',
        usdzUrl: undefined,
        thumbnailUrl: undefined,
        status: 'active',
        brandId: 'brand-1',
        productId: 'model-1',
        viewsCount: 0,
        tryOnsCount: 0,
        conversionsCount: 0,
        metadata: undefined,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.product.findFirst.mockResolvedValue({
        id: 'model-1',
        name: 'Model',
        model3dUrl: 'https://cdn.example.com/model.glb',
        thumbnailUrl: null,
        category: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        modelConfig: null,
        tags: [],
      });
      mockPrismaService.analyticsEvent.count.mockResolvedValue(0);
      mockPrismaService.orderItem.count.mockResolvedValue(0);

      const result = await service.generateQRCode('model-1', 'brand-1');

      expect(result).toHaveProperty('url');
      expect(result.url).toContain('/ar/preview/model-1');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('expiresAt');
    });

    it('should throw NotFoundException when model not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.generateQRCode('missing', 'brand-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.generateQRCode('missing', 'brand-1')).rejects.toThrow(
        'AR model not found',
      );
    });
  });

  describe('convert2DTo3D', () => {
    it('should throw NotFoundException when design not found', async () => {
      mockPrismaService.design.findUnique.mockResolvedValue(null);

      await expect(
        service.convert2DTo3D('user-1', 'brand-1', 'design-1', 'https://image.url'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.convert2DTo3D('user-1', 'brand-1', 'design-1', 'https://image.url'),
      ).rejects.toThrow('Design not found');
    });

    it('should throw ForbiddenException when design belongs to another user', async () => {
      mockPrismaService.design.findUnique.mockResolvedValue({
        id: 'design-1',
        userId: 'other-user',
        brandId: 'brand-1',
        prompt: 'test',
      });

      await expect(
        service.convert2DTo3D('user-1', 'brand-1', 'design-1', 'https://image.url'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.convert2DTo3D('user-1', 'brand-1', 'design-1', 'https://image.url'),
      ).rejects.toThrow('Access denied to this design');
    });

    it('should throw BadRequestException when Meshy API key not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'MESHY_API_KEY' ? undefined : 'https://app.luneo.io',
      );
      mockPrismaService.design.findUnique.mockResolvedValue({
        id: 'design-1',
        userId: 'user-1',
        brandId: 'brand-1',
        prompt: 'test',
      });

      await expect(
        service.convert2DTo3D('user-1', 'brand-1', 'design-1', 'https://image.url'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.convert2DTo3D('user-1', 'brand-1', 'design-1', 'https://image.url'),
      ).rejects.toThrow('Meshy.ai API not configured');
    });

    it('should create product and return task id when Meshy succeeds', async () => {
      mockConfigService.get.mockImplementation((key: string): string | undefined => {
        if (key === 'MESHY_API_KEY') return 'meshy-key';
        if (key === 'app.frontendUrl') return 'https://app.luneo.io';
        return undefined;
      });
      mockPrismaService.design.findUnique.mockResolvedValue({
        id: 'design-1',
        userId: 'user-1',
        brandId: 'brand-1',
        prompt: 'A cool shoe',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 'task-meshy-123' }),
      });
      mockPrismaService.product.create.mockResolvedValue({
        id: 'product-ar-1',
        name: 'A cool shoe - 3D',
      });

      const result = await service.convert2DTo3D(
        'user-1',
        'brand-1',
        'design-1',
        'https://image.url',
      );

      expect(result).toMatchObject({
        ar_model_id: 'product-ar-1',
        task_id: 'task-meshy-123',
        status: 'processing',
      });
      expect(mockPrismaService.product.create).toHaveBeenCalled();
    });

    it('should throw when Meshy API returns error', async () => {
      mockConfigService.get.mockImplementation((key: string): string | undefined =>
        key === 'MESHY_API_KEY' ? 'test-meshy-key' : undefined,
      );
      mockPrismaService.design.findUnique.mockResolvedValue({
        id: 'design-1',
        userId: 'user-1',
        brandId: 'brand-1',
        prompt: 'test',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Meshy quota exceeded' }),
      });

      await expect(
        service.convert2DTo3D('user-1', 'brand-1', 'design-1', 'https://image.url'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getConversionStatus', () => {
    it('should throw when Meshy API key not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(
        service.getConversionStatus('task-1', 'user-1', 'brand-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getConversionStatus('task-1', 'user-1', 'brand-1'),
      ).rejects.toThrow('Meshy.ai API not configured');
    });

    it('should return status from Meshy and update product when SUCCEEDED', async () => {
      mockConfigService.get.mockImplementation((key: string): string | undefined =>
        key === 'MESHY_API_KEY' ? 'test-meshy-key' : undefined,
      );
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'SUCCEEDED',
              progress: 100,
              model_urls: { glb: 'https://meshy.com/out.glb' },
            }),
        });
      mockPrismaService.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          modelConfig: { meshy_task_id: 'task-1' },
        },
      ]);
      mockPrismaService.product.update.mockResolvedValue({});

      const result = await service.getConversionStatus('task-1', 'user-1', 'brand-1');

      expect(result).toEqual({
        status: 'SUCCEEDED',
        progress: 100,
        model_url: 'https://meshy.com/out.glb',
      });
      expect(mockPrismaService.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            model3dUrl: 'https://meshy.com/out.glb',
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should throw when status check request fails', async () => {
      mockConfigService.get.mockReturnValue('test-meshy-key');
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      await expect(
        service.getConversionStatus('task-1', 'user-1', 'brand-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportModel', () => {
    it('should throw NotFoundException when model not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.exportModel('missing', 'brand-1', 'glb'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return download URL and file size for public GLB', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        id: 'model-1',
        name: 'M',
        model3dUrl: 'https://cdn.example.com/model.glb',
        thumbnailUrl: null,
        category: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        modelConfig: null,
        tags: [],
      });
      mockPrismaService.analyticsEvent.count.mockResolvedValue(0);
      mockPrismaService.orderItem.count.mockResolvedValue(0);
      mockPrismaService.product.findUnique.mockResolvedValue({ isPublic: true });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': '12345' }),
      });

      const result = await service.exportModel('model-1', 'brand-1', 'glb');

      expect(result).toMatchObject({
        downloadUrl: 'https://cdn.example.com/model.glb',
        format: 'glb',
      });
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('getModelAnalytics', () => {
    it('should return views, tryOns, conversions and conversion rate', async () => {
      mockPrismaService.analyticsEvent.findMany.mockResolvedValue([
        { eventType: 'ar_view' },
        { eventType: 'ar_view' },
        { eventType: 'ar_try_on' },
        { eventType: 'ar_conversion' },
      ]);

      const result = await service.getModelAnalytics('model-1', 'brand-1');

      expect(result).toEqual({
        views: 2,
        tryOns: 1,
        conversions: 1,
        conversionRate: 100,
      });
    });
  });
});
