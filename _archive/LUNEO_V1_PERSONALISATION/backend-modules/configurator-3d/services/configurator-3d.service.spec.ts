/**
 * Configurator3DService unit tests
 * Matches actual service: constructor(prisma, validationService, cacheService)
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfiguratorStatus, ConfiguratorType } from '@prisma/client';
import { Configurator3DService } from './configurator-3d.service';
import type { CreateConfigDto, UpdateConfigDto } from './configurator-3d.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Configurator3DValidationService } from './configurator-3d-validation.service';
import { Configurator3DCacheService } from './configurator-3d-cache.service';

describe('Configurator3DService', () => {
  let service: Configurator3DService;
  let _prisma: PrismaService;
  let validationService: Configurator3DValidationService;
  let _cacheService: Configurator3DCacheService;

  const brandId = 'brand-1';
  const configId = 'cfg-1';

  const mockPrisma = {
    configurator3DConfiguration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    configurator3DComponent: { create: jest.fn() },
    configurator3DOption: { create: jest.fn() },
    configurator3DRule: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockValidationService = {
    validateForPublish: jest.fn(),
  };

  const mockCacheService = {
    invalidateConfiguration: jest.fn(),
    warmupConfiguration: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: Configurator3DValidationService, useValue: mockValidationService },
        { provide: Configurator3DCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<Configurator3DService>(Configurator3DService);
    prisma = module.get<PrismaService>(PrismaService);
    validationService = module.get<Configurator3DValidationService>(Configurator3DValidationService);
    cacheService = module.get<Configurator3DCacheService>(Configurator3DCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated configurations for brand', async () => {
      const data = [{ id: configId, name: 'Config 1', brandId }];
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue(data);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(1);

      const result = await service.findAll(brandId, { page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.configurator3DConfiguration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId, deletedAt: null },
        }),
      );
    });

    it('should filter by brandId only when no search or status', async () => {
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue([]);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(0);

      await service.findAll(brandId);

      expect(mockPrisma.configurator3DConfiguration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId, deletedAt: null },
        }),
      );
    });

    it('should apply search filter when params.search provided', async () => {
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue([]);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(0);

      await service.findAll(brandId, { search: 'chair' });

      expect(mockPrisma.configurator3DConfiguration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brandId,
            deletedAt: null,
            OR: [
              { name: { contains: 'chair', mode: 'insensitive' } },
              { description: { contains: 'chair', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should apply status filter when params.status provided', async () => {
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue([]);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(0);

      await service.findAll(brandId, { status: ConfiguratorStatus.PUBLISHED });

      expect(mockPrisma.configurator3DConfiguration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ConfiguratorStatus.PUBLISHED }),
        }),
      );
    });

    it('should apply type filter when params.type provided', async () => {
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue([]);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(0);

      await service.findAll(brandId, { type: ConfiguratorType.CUSTOM });

      expect(mockPrisma.configurator3DConfiguration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: ConfiguratorType.CUSTOM }),
        }),
      );
    });

    it('should use default sortBy createdAt desc', async () => {
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue([]);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(0);

      await service.findAll(brandId);

      expect(mockPrisma.configurator3DConfiguration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should respect pagination params', async () => {
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue([]);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(0);

      await service.findAll(brandId, { page: 2, limit: 5 });

      expect(mockPrisma.configurator3DConfiguration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return configuration when found', async () => {
      const config = {
        id: configId,
        brandId,
        name: 'Config',
        components: [],
        options: [],
        rules: [],
      };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(config);

      const result = await service.findOne(configId, brandId);

      expect(result).toEqual(config);
      expect(mockPrisma.configurator3DConfiguration.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: configId, brandId, deletedAt: null },
        }),
      );
    });

    it('should include analytics when includeAnalytics option is true', async () => {
      const config = { id: configId, brandId, components: [], options: [], rules: [] };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(config);

      await service.findOne(configId, brandId, { includeAnalytics: true });

      expect(mockPrisma.configurator3DConfiguration.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            analytics: { take: 30, orderBy: { date: 'desc' } },
          }),
        }),
      );
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', brandId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing', brandId)).rejects.toThrow(
        /Configurator 3D configuration with ID missing not found/,
      );
    });
  });

  describe('findOnePublic', () => {
    it('should return config when slug matches and isPublic, PUBLISHED, isActive', async () => {
      const config = {
        id: configId,
        slug: 'my-config-abc',
        isPublic: true,
        status: ConfiguratorStatus.PUBLISHED,
        brand: {},
        components: [],
        rules: [],
      };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(config);

      const result = await service.findOnePublic('my-config-abc');

      expect(result).toEqual(config);
      expect(mockPrisma.configurator3DConfiguration.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ id: 'my-config-abc' }, { slug: 'my-config-abc' }],
            isPublic: true,
            status: ConfiguratorStatus.PUBLISHED,
            deletedAt: null,
          },
        }),
      );
    });

    it('should throw NotFoundException when no public config found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.findOnePublic('missing')).rejects.toThrow(NotFoundException);
      await expect(service.findOnePublic('missing')).rejects.toThrow(
        /Public configurator with slug\/ID missing not found/,
      );
    });
  });

  describe('create', () => {
    it('should create configuration with slug and brandId', async () => {
      const dto: CreateConfigDto = { name: 'New Config', description: 'Desc' };
      const created = { id: configId, brandId, name: dto.name, slug: 'new-config-abc123', status: ConfiguratorStatus.DRAFT };
      mockPrisma.configurator3DConfiguration.create.mockResolvedValue(created);

      const result = await service.create(brandId, dto);

      expect(result).toEqual(created);
      expect(mockPrisma.configurator3DConfiguration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          brandId,
          name: dto.name,
          description: dto.description,
          status: ConfiguratorStatus.DRAFT,
          type: ConfiguratorType.CUSTOM,
        }),
      });
      expect(result.slug).toBeDefined();
    });

    it('should accept optional user and set createdById', async () => {
      const dto: CreateConfigDto = { name: 'Config' };
      const created = { id: configId, brandId, name: dto.name, slug: 'config-xyz', createdById: 'user-1' };
      mockPrisma.configurator3DConfiguration.create.mockResolvedValue(created);

      await service.create(brandId, dto, { id: 'user-1' } as unknown);

      expect(mockPrisma.configurator3DConfiguration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ createdById: 'user-1' }),
      });
    });
  });

  describe('update', () => {
    it('should update configuration', async () => {
      const existing = { id: configId, brandId, components: [], options: [], rules: [] };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(existing);
      const updated = { id: configId, name: 'Updated Name' };
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue(updated);

      const dto: UpdateConfigDto = { name: 'Updated Name' };
      const result = await service.update(configId, brandId, dto);

      expect(result).toEqual(updated);
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalledWith({
        where: { id: configId },
        data: { name: 'Updated Name' },
      });
    });

    it('should throw NotFoundException when config not found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.update('missing', brandId, { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete (soft delete)', () => {
    it('should set deletedAt and not hard delete', async () => {
      const existing = { id: configId, brandId, components: [], options: [], rules: [] };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(existing);
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue({});

      const result = await service.delete(configId, brandId);

      expect(result.success).toBe(true);
      expect(result.id).toBe(configId);
      expect(result.deletedAt).toBeDefined();
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalledWith({
        where: { id: configId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockCacheService.invalidateConfiguration).toHaveBeenCalledWith(configId);
    });

    it('should throw NotFoundException when config not found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.delete('missing', brandId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('clone', () => {
    it('should clone config with components, options, and rules', async () => {
      const source = {
        id: configId,
        brandId,
        name: 'Source',
        description: 'Desc',
        type: ConfiguratorType.CUSTOM,
        modelUrl: 'https://model.glb',
        sceneConfig: {},
        uiConfig: {},
        pricingSettings: {},
        settings: {},
        tags: [],
        components: [
          { id: 'comp-1', name: 'C1', technicalId: 't1', configurationId: configId, sortOrder: 0, options: [] },
        ],
        options: [
          { id: 'opt-1', componentId: 'comp-1', name: 'O1', configurationId: configId },
        ],
        rules: [{ id: 'rule-1', name: 'R1', configurationId: configId, priority: 1 }],
      };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(source);
      const newConfig = { id: 'cfg-2', brandId, name: 'Cloned', slug: 'cloned-xyz' };
      const newComp = { id: 'comp-2' };
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          configurator3DConfiguration: { create: jest.fn().mockResolvedValue(newConfig) },
          configurator3DComponent: { create: jest.fn().mockResolvedValue(newComp) },
          configurator3DOption: { create: jest.fn().mockResolvedValue({}) },
          configurator3DRule: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });
      mockPrisma.configurator3DConfiguration.findFirst
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce({ ...newConfig, components: [], options: [], rules: [] });

      const result = await service.clone(configId, brandId, 'Cloned');

      expect(result).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should call validationService and set status PUBLISHED when valid', async () => {
      mockValidationService.validateForPublish.mockResolvedValue({ isValid: true, errors: [], warnings: [] });
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({ id: configId, version: 1 });
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue({});

      const result = await service.publish(configId, brandId);

      expect(validationService.validateForPublish).toHaveBeenCalledWith(configId);
      expect(result.isValid).toBe(true);
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: configId, brandId },
          data: expect.objectContaining({ status: ConfiguratorStatus.PUBLISHED }),
        }),
      );
      expect(mockCacheService.warmupConfiguration).toHaveBeenCalledWith(configId);
    });

    it('should throw BadRequestException when validation fails', async () => {
      mockValidationService.validateForPublish.mockResolvedValue({
        isValid: false,
        errors: ['Configuration must have a modelUrl'],
        warnings: [],
      });

      await expect(service.publish(configId, brandId)).rejects.toThrow(BadRequestException);
      await expect(service.publish(configId, brandId)).rejects.toThrow(/Configuration validation failed/);
      expect(mockPrisma.configurator3DConfiguration.update).not.toHaveBeenCalled();
    });
  });

  describe('unpublish', () => {
    it('should set status to DRAFT and invalidate cache', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configId, brandId });
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue({});

      const result = await service.unpublish(configId, brandId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(ConfiguratorStatus.DRAFT);
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalledWith({
        where: { id: configId },
        data: { status: ConfiguratorStatus.DRAFT },
      });
      expect(mockCacheService.invalidateConfiguration).toHaveBeenCalledWith(configId);
    });
  });

  describe('archive', () => {
    it('should set status to ARCHIVED', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configId, brandId });
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue({});

      const result = await service.archive(configId, brandId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(ConfiguratorStatus.ARCHIVED);
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalledWith({
        where: { id: configId },
        data: expect.objectContaining({
          status: ConfiguratorStatus.ARCHIVED,
          archivedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('validate', () => {
    it('should call validationService.validateForPublish', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configId, brandId });
      mockValidationService.validateForPublish.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: ['Optional: add thumbnail'],
      });

      const result = await service.validate(configId, brandId);

      expect(result).toEqual({ isValid: true, errors: [], warnings: ['Optional: add thumbnail'] });
      expect(validationService.validateForPublish).toHaveBeenCalledWith(configId);
    });

    it('should throw NotFoundException when config not found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.validate('missing', brandId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEmbedCode', () => {
    it('should return iframe, script, and directUrl', () => {
      const config = { id: configId, slug: 'my-config' };
      const baseUrl = 'https://app.luneo.io';

      const result = service.getEmbedCode(config, baseUrl);

      expect(result.iframe).toContain('<iframe');
      expect(result.iframe).toContain('/embed/3d/my-config');
      expect(result.script).toContain('data-config-id="' + configId + '"');
      expect(result.directUrl).toBe('https://app.luneo.io/embed/3d/my-config');
    });

    it('should use default baseUrl when not provided', () => {
      const result = service.getEmbedCode({ id: configId, slug: 'x' });
      expect(result.directUrl).toContain('https://app.luneo.io');
    });
  });

  describe('incrementViewCount', () => {
    it('should increment viewCount for config', async () => {
      mockPrisma.configurator3DConfiguration.updateMany.mockResolvedValue({ count: 1 });

      await service.incrementViewCount(configId, brandId);

      expect(mockPrisma.configurator3DConfiguration.updateMany).toHaveBeenCalledWith({
        where: { id: configId, brandId },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('incrementSessionCount', () => {
    it('should increment sessionCount for config', async () => {
      mockPrisma.configurator3DConfiguration.updateMany.mockResolvedValue({ count: 1 });

      await service.incrementSessionCount(configId, brandId);

      expect(mockPrisma.configurator3DConfiguration.updateMany).toHaveBeenCalledWith({
        where: { id: configId, brandId },
        data: { sessionCount: { increment: 1 } },
      });
    });
  });

  describe('patch', () => {
    it('should delegate to update', async () => {
      const existing = { id: configId, brandId, components: [], options: [], rules: [] };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(existing);
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue({ id: configId, description: 'Patched' });

      const result = await service.patch(configId, brandId, { description: 'Patched' });

      expect(result.description).toBe('Patched');
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalled();
    });
  });
});
