/**
 * Configurator3DComponentsService unit tests
 * Constructor: prisma
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SelectionMode } from '@prisma/client';
import { Configurator3DComponentsService } from './configurator-3d-components.service';
import type { CreateComponentDto, BulkCreateComponentDto } from './configurator-3d-components.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CONFIGURATOR_3D_LIMITS } from '../configurator-3d.constants';

describe('Configurator3DComponentsService', () => {
  let service: Configurator3DComponentsService;
  let prisma: PrismaService;

  const configurationId = 'cfg-1';
  const brandId = 'brand-1';
  const componentId = 'comp-1';

  const mockPrisma = {
    configurator3DConfiguration: { findFirst: jest.fn() },
    configurator3DComponent: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DComponentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<Configurator3DComponentsService>(Configurator3DComponentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create component when under limit', async () => {
      mockPrisma.configurator3DComponent.count.mockResolvedValue(5);
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configurationId, brandId });
      const created = { id: componentId, configurationId, name: 'Color', type: 'color', sortOrder: 5 };
      mockPrisma.configurator3DComponent.create.mockResolvedValue(created);

      const dto: CreateComponentDto = { name: 'Color', type: 'color' };
      const result = await service.create(configurationId, brandId, dto);

      expect(result).toEqual(created);
      expect(mockPrisma.configurator3DComponent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configurationId,
          name: 'Color',
          type: 'color',
          selectionMode: SelectionMode.SINGLE,
          isRequired: false,
          sortOrder: 5,
        }),
      });
    });

    it('should throw BadRequestException when max components reached', async () => {
      mockPrisma.configurator3DComponent.count.mockResolvedValue(CONFIGURATOR_3D_LIMITS.MAX_COMPONENTS_PER_CONFIG);

      const dto: CreateComponentDto = { name: 'X', type: 'text' };
      await expect(service.create(configurationId, brandId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(configurationId, brandId, dto)).rejects.toThrow(
        new RegExp(`Maximum ${CONFIGURATOR_3D_LIMITS.MAX_COMPONENTS_PER_CONFIG}`),
      );
      expect(mockPrisma.configurator3DComponent.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when configuration not found or wrong brand', async () => {
      mockPrisma.configurator3DComponent.count.mockResolvedValue(0);
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.create('missing', brandId, { name: 'X', type: 'text' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create('missing', brandId, { name: 'X', type: 'text' })).rejects.toThrow(
        /Configuration missing not found or access denied/,
      );
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple components', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configurationId, brandId });
      mockPrisma.configurator3DComponent.count.mockResolvedValue(0);
      const created = [
        { id: 'c1', name: 'C1', configurationId },
        { id: 'c2', name: 'C2', configurationId },
      ];
      mockPrisma.$transaction.mockResolvedValue(created);

      const dtos: BulkCreateComponentDto[] = [
        { name: 'C1', type: 'color' },
        { name: 'C2', type: 'material' },
      ];
      const result = await service.bulkCreate(configurationId, brandId, dtos);

      expect(result).toEqual(created);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when bulk count exceeds MAX_BULK_COMPONENTS', async () => {
      const dtos = Array(CONFIGURATOR_3D_LIMITS.MAX_BULK_COMPONENTS + 1)
        .fill(null)
        .map((_, i) => ({ name: `C${i}`, type: 'text' }));

      await expect(service.bulkCreate(configurationId, brandId, dtos)).rejects.toThrow(BadRequestException);
      await expect(service.bulkCreate(configurationId, brandId, dtos)).rejects.toThrow(
        new RegExp(`Maximum ${CONFIGURATOR_3D_LIMITS.MAX_BULK_COMPONENTS}`),
      );
    });

    it('should throw BadRequestException when total would exceed MAX_COMPONENTS_PER_CONFIG', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configurationId, brandId });
      mockPrisma.configurator3DComponent.count.mockResolvedValue(
        CONFIGURATOR_3D_LIMITS.MAX_COMPONENTS_PER_CONFIG - 5,
      );
      const dtos = Array(10).fill(null).map((_, i) => ({ name: `C${i}`, type: 'text' }));

      await expect(service.bulkCreate(configurationId, brandId, dtos)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return components ordered by sortOrder', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configurationId, brandId });
      const components = [{ id: 'c1', name: 'C1', sortOrder: 0 }, { id: 'c2', name: 'C2', sortOrder: 1 }];
      mockPrisma.configurator3DComponent.findMany.mockResolvedValue(components);

      const result = await service.findAll(configurationId, brandId);

      expect(result).toEqual(components);
      expect(mockPrisma.configurator3DComponent.findMany).toHaveBeenCalledWith({
        where: { configurationId },
        orderBy: { sortOrder: 'asc' },
        include: undefined,
      });
    });

    it('should include options when includeOptions true', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configurationId, brandId });
      mockPrisma.configurator3DComponent.findMany.mockResolvedValue([]);

      await service.findAll(configurationId, brandId, { includeOptions: true });

      expect(mockPrisma.configurator3DComponent.findMany).toHaveBeenCalledWith({
        where: { configurationId },
        include: { options: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.findAll('missing', brandId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return component when found', async () => {
      const component = { id: componentId, configurationId, name: 'Color', configuration: { brandId } };
      mockPrisma.configurator3DComponent.findFirst.mockResolvedValue(component);

      const result = await service.findOne(configurationId, componentId, brandId);

      expect(result).toEqual(component);
      expect(mockPrisma.configurator3DComponent.findFirst).toHaveBeenCalledWith({
        where: { id: componentId, configurationId, configuration: { brandId } },
        include: undefined,
      });
    });

    it('should throw NotFoundException when component not found', async () => {
      mockPrisma.configurator3DComponent.findFirst.mockResolvedValue(null);

      await expect(service.findOne(configurationId, 'missing', brandId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(configurationId, 'missing', brandId)).rejects.toThrow(
        /Component missing not found in configuration/,
      );
    });
  });

  describe('update', () => {
    it('should update component', async () => {
      mockPrisma.configurator3DComponent.findFirst.mockResolvedValue({
        id: componentId,
        configurationId,
        configuration: { brandId },
      });
      const updated = { id: componentId, name: 'Updated Name' };
      mockPrisma.configurator3DComponent.update.mockResolvedValue(updated);

      const result = await service.update(configurationId, componentId, brandId, { name: 'Updated Name' });

      expect(result).toEqual(updated);
      expect(mockPrisma.configurator3DComponent.update).toHaveBeenCalledWith({
        where: { id: componentId },
        data: { name: 'Updated Name' },
      });
    });

    it('should throw NotFoundException when component not found', async () => {
      mockPrisma.configurator3DComponent.findFirst.mockResolvedValue(null);

      await expect(
        service.update(configurationId, 'missing', brandId, { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete component', async () => {
      mockPrisma.configurator3DComponent.findFirst.mockResolvedValue({
        id: componentId,
        configurationId,
        configuration: { brandId },
      });
      mockPrisma.configurator3DComponent.delete.mockResolvedValue({});

      const result = await service.delete(configurationId, componentId, brandId);

      expect(result).toEqual({ success: true, componentId });
      expect(mockPrisma.configurator3DComponent.delete).toHaveBeenCalledWith({ where: { id: componentId } });
    });

    it('should throw NotFoundException when component not found', async () => {
      mockPrisma.configurator3DComponent.findFirst.mockResolvedValue(null);

      await expect(service.delete(configurationId, 'missing', brandId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('should update sortOrder for each component', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configurationId, brandId });
      mockPrisma.configurator3DComponent.findMany.mockResolvedValue([]);
      mockPrisma.$transaction.mockResolvedValue([]);

      const order = [
        { componentId: 'c1', sortOrder: 1 },
        { componentId: 'c2', sortOrder: 0 },
      ];
      const result = await service.reorder(configurationId, brandId, order);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.configurator3DComponent.findMany).toHaveBeenCalledWith({
        where: { configurationId },
        orderBy: { sortOrder: 'asc' },
        include: undefined,
      });
      expect(result).toEqual([]);
    });

    it('should throw BadRequestException when order length exceeds MAX_REORDER_ITEMS', async () => {
      const order = Array(CONFIGURATOR_3D_LIMITS.MAX_REORDER_ITEMS + 1)
        .fill(null)
        .map((_, i) => ({ componentId: `c${i}`, sortOrder: i }));

      await expect(service.reorder(configurationId, brandId, order)).rejects.toThrow(BadRequestException);
      await expect(service.reorder(configurationId, brandId, order)).rejects.toThrow(
        new RegExp(`Maximum ${CONFIGURATOR_3D_LIMITS.MAX_REORDER_ITEMS}`),
      );
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);
      const order = [{ componentId: 'c1', sortOrder: 0 }];

      await expect(service.reorder('missing', brandId, order)).rejects.toThrow(NotFoundException);
    });
  });
});
