import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Render3DService } from './render-3d.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { RenderRequest } from '../interfaces/render.interface';
import { QuotasService } from '@/modules/usage-billing/services/quotas.service';
import { UsageTrackingService } from '@/modules/usage-billing/services/usage-tracking.service';

describe('Render3DService', () => {
  let service: Render3DService;

  const mockPrismaService = {
    product3DConfiguration: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  const mockStorageService = {
    uploadBuffer: jest.fn().mockResolvedValue('https://storage.example.com/ar-model.glb'),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    getOrSet: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'RENDER_3D_SERVICE_URL') return '';
      if (key === 'REPLICATE_API_KEY') return '';
      if (key === 'app.frontendUrl') return 'https://app.luneo.io';
      return undefined;
    }),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'RENDER_3D_SERVICE_URL') return '';
      if (key === 'REPLICATE_API_KEY') return '';
      if (key === 'app.frontendUrl') return 'https://app.luneo.io';
      return undefined;
    });
    mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1', brandId: 'brand-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Render3DService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: SmartCacheService, useValue: mockCache },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: QuotasService, useValue: { enforceQuota: jest.fn().mockResolvedValue(undefined) } },
        { provide: UsageTrackingService, useValue: { track: jest.fn().mockResolvedValue(undefined), trackRender3D: jest.fn().mockResolvedValue(undefined), trackExportGLTF: jest.fn().mockResolvedValue(undefined), trackExportUSDZ: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<Render3DService>(Render3DService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('render3D', () => {
    const baseRequest: RenderRequest = {
      id: 'req-1',
      type: '3d',
      productId: 'prod-1',
      options: {
        width: 800,
        height: 600,
        exportFormat: 'gltf',
        quality: 'standard',
      },
    };

    it('should return success when external render service returns URL', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1', brandId: 'brand-1' });
      const configWithUrl = {
        get: jest.fn((key: string) => {
          if (key === 'RENDER_3D_SERVICE_URL') return 'https://render-service.example.com';
          if (key === 'REPLICATE_API_KEY') return '';
          if (key === 'app.frontendUrl') return 'https://app.luneo.io';
          return undefined;
        }),
      };
      const moduleWithUrl = await Test.createTestingModule({
        providers: [
          Render3DService,
          { provide: PrismaService, useValue: mockPrismaService },
          { provide: StorageService, useValue: mockStorageService },
          { provide: SmartCacheService, useValue: mockCache },
          { provide: ConfigService, useValue: configWithUrl },
          { provide: HttpService, useValue: mockHttpService },
          { provide: QuotasService, useValue: { enforceQuota: jest.fn().mockResolvedValue(undefined) } },
          { provide: UsageTrackingService, useValue: { track: jest.fn().mockResolvedValue(undefined), trackRender3D: jest.fn().mockResolvedValue(undefined), trackExportGLTF: jest.fn().mockResolvedValue(undefined), trackExportUSDZ: jest.fn().mockResolvedValue(undefined) } },
        ],
      }).compile();
      const svc = moduleWithUrl.get<Render3DService>(Render3DService);

      mockHttpService.post.mockReturnValue(
        of({
          data: { url: 'https://rendered.example.com/out.glb', thumbnailUrl: 'https://thumb.png' },
          status: 200,
        }),
      );

      const result = await svc.render3D(baseRequest);

      expect(result.status).toBe('success');
      expect(result.url).toBe('https://rendered.example.com/out.glb');
      expect(result.thumbnailUrl).toBe('https://thumb.png');
      expect(result.id).toBe('req-1');
    });

    it('should return failed when no external service configured', async () => {
      const result = await service.render3D(baseRequest);

      expect(result.status).toBe('failed');
      expect(result.error).toMatch(/No 3D render service configured|Render processing failed/);
      expect(result.id).toBe('req-1');
    });

    it('should return failed when external service throws (timeout)', async () => {
      const configWithUrl = {
        get: jest.fn((key: string) => {
          if (key === 'RENDER_3D_SERVICE_URL') return 'https://render.example.com';
          if (key === 'REPLICATE_API_KEY') return '';
          return undefined;
        }),
      };
      const moduleWithUrl = await Test.createTestingModule({
        providers: [
          Render3DService,
          { provide: PrismaService, useValue: mockPrismaService },
          { provide: StorageService, useValue: mockStorageService },
          { provide: SmartCacheService, useValue: mockCache },
          { provide: ConfigService, useValue: configWithUrl },
          { provide: HttpService, useValue: mockHttpService },
          { provide: QuotasService, useValue: { enforceQuota: jest.fn().mockResolvedValue(undefined) } },
          { provide: UsageTrackingService, useValue: { track: jest.fn().mockResolvedValue(undefined), trackRender3D: jest.fn().mockResolvedValue(undefined), trackExportGLTF: jest.fn().mockResolvedValue(undefined), trackExportUSDZ: jest.fn().mockResolvedValue(undefined) } },
        ],
      }).compile();
      const svc = moduleWithUrl.get<Render3DService>(Render3DService);

      mockHttpService.post.mockReturnValue(throwError(() => new Error('Network timeout')));

      const result = await svc.render3D(baseRequest);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });
  });

  describe('render3DHighRes', () => {
    it('should throw NotFoundException when configuration not found', async () => {
      mockPrismaService.product3DConfiguration.findUnique.mockResolvedValue(null);
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.render3DHighRes(
          { configurationId: 'missing', preset: 'hd' },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return modelUrl when configuration has modelUrl and no external service', async () => {
      mockPrismaService.product3DConfiguration.findUnique.mockResolvedValue(null);
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'config-1',
        brandId: 'brand-1',
        model3dUrl: 'https://cdn.example.com/model.glb',
      });

      const result = await service.render3DHighRes(
        { configurationId: 'config-1', preset: 'hd', format: 'png' },
        'user-1',
      );

      expect(result.renderUrl).toBe('https://cdn.example.com/model.glb');
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.preset).toBe('hd');
    });

    it('should throw BadRequestException when no model URL available', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'config-1', brandId: 'brand-1' });
      // Return a 3D config row with no modelUrl so service gets config then fails on missing model URL
      mockPrismaService.product3DConfiguration.findUnique.mockResolvedValue({
        id: 'cfg-1',
        productId: 'config-1',
        modelUrl: null,
        textureUrl: null,
        materialType: 'pbr',
        environmentMap: null,
        lightingPreset: 'default',
        cameraPosition: null,
        cameraTarget: null,
        customZones: null,
        renderSettings: null,
      });

      await expect(
        service.render3DHighRes(
          { configurationId: 'config-1', preset: 'hd' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.render3DHighRes(
          { configurationId: 'config-1', preset: 'hd' },
          'user-1',
        ),
      ).rejects.toThrow(/no model URL/);
    });
  });

  describe('exportAR', () => {
    it('should throw NotFoundException when configuration not found', async () => {
      mockPrismaService.product3DConfiguration.findUnique.mockResolvedValue(null);
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.exportAR(
          { configurationId: 'missing', platform: 'web' },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return export with placeholder GLB when no conversion available', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'cfg-1', brandId: 'brand-1' });
      mockPrismaService.product3DConfiguration.findUnique.mockResolvedValue({
        id: 'cfg-1',
        productId: 'cfg-1',
        modelUrl: null,
        textureUrl: null,
        materialType: 'pbr',
        environmentMap: null,
        lightingPreset: 'default',
        cameraPosition: null,
        cameraTarget: null,
        customZones: null,
        renderSettings: null,
      });

      mockStorageService.uploadBuffer.mockResolvedValue('https://storage.example.com/ar-model.glb');

      const result = await service.exportAR(
        { configurationId: 'cfg-1', platform: 'web', includeTextures: true },
        'user-1',
      );

      expect(result.exportUrl).toBeTruthy();
      expect(result.platform).toBe('web');
      expect(result.format).toBe('glb');
      expect(result.mimeType).toBe('model/gltf-binary');
      expect(mockStorageService.uploadBuffer).toHaveBeenCalled();
    });
  });
});
