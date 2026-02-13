/**
 * Configurator3DService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Configurator3DService } from './configurator-3d.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateConfigurator3DConfigurationDto } from '../dto/create-configurator-3d.dto';
import { Configurator3DOptionType } from '@prisma/client';

describe('Configurator3DService', () => {
  let service: Configurator3DService;
  let prisma: PrismaService;

  const mockPrisma = {
    configurator3DConfiguration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    configurator3DOption: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  const projectId = 'proj-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<Configurator3DService>(Configurator3DService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated configurations', async () => {
      const data = [{ id: 'cfg1', name: 'Config 1', projectId }];
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue(data);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(1);

      const result = await service.findAll(projectId, { page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.configurator3DConfiguration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return configuration when found', async () => {
      const config = { id: 'cfg1', name: 'Config', projectId, options: [], components: [], _count: {} };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(config);

      const result = await service.findOne('cfg1', projectId);

      expect(result).toEqual(config);
      expect(mockPrisma.configurator3DConfiguration.findFirst).toHaveBeenCalledWith({
        where: { id: 'cfg1', projectId },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', projectId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing', projectId)).rejects.toThrow(
        /Configurator 3D configuration with ID missing not found/,
      );
    });
  });

  describe('create', () => {
    it('should create configuration when project exists', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: projectId, brandId: 'brand-1' });
      const dto: CreateConfigurator3DConfigurationDto = {
        name: 'New Config',
        sceneConfig: { camera: {} },
      };
      const created = { id: 'cfg1', name: dto.name, projectId };
      mockPrisma.configurator3DConfiguration.create.mockResolvedValue(created);

      const result = await service.create(projectId, dto);

      expect(result).toEqual(created);
      expect(mockPrisma.configurator3DConfiguration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: dto.name, projectId }),
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create('missing', { name: 'Config', sceneConfig: {} }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('missing', { name: 'Config', sceneConfig: {} }),
      ).rejects.toThrow(/Project with ID missing not found/);
    });
  });

  describe('update', () => {
    it('should update configuration', async () => {
      const existing = { id: 'cfg1', projectId, options: [], components: [], _count: {} };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(existing);
      const updated = { id: 'cfg1', name: 'Updated' };
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue(updated);

      const result = await service.update('cfg1', projectId, { name: 'Updated' } as any);

      expect(result).toEqual(updated);
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalledWith({
        where: { id: 'cfg1' },
        data: { name: 'Updated' },
        select: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should delete configuration', async () => {
      const existing = { id: 'cfg1', projectId, options: [], components: [], _count: {} };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(existing);
      mockPrisma.configurator3DConfiguration.delete.mockResolvedValue({});

      const result = await service.remove('cfg1', projectId);

      expect(result).toMatchObject({ success: true });
      expect(mockPrisma.configurator3DConfiguration.delete).toHaveBeenCalledWith({
        where: { id: 'cfg1' },
      });
    });
  });

  describe('addOption', () => {
    it('should add option to configuration', async () => {
      const existing = { id: 'cfg1', projectId, options: [], components: [], _count: {} };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(existing);
      const option = {
        id: 'opt1',
        name: 'color',
        type: Configurator3DOptionType.COLOR,
        label: 'Color',
        configurationId: 'cfg1',
      };
      mockPrisma.configurator3DOption.create.mockResolvedValue(option);

      const result = await service.addOption(
        'cfg1',
        projectId,
        {
          name: 'color',
          type: Configurator3DOptionType.COLOR,
          label: 'Color',
          values: {},
        } as any,
      );

      expect(result).toEqual(option);
      expect(mockPrisma.configurator3DOption.create).toHaveBeenCalled();
    });
  });

  describe('removeOption', () => {
    it('should remove option', async () => {
      const existing = { id: 'cfg1', projectId, options: [], components: [], _count: {} };
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(existing);
      mockPrisma.configurator3DOption.delete.mockResolvedValue({});

      const result = await service.removeOption('cfg1', projectId, 'opt1');

      expect(result).toMatchObject({ success: true });
      expect(mockPrisma.configurator3DOption.delete).toHaveBeenCalledWith({
        where: { id: 'opt1' },
      });
    });
  });
});
