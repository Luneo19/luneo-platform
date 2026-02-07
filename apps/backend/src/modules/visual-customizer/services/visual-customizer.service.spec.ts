/**
 * VisualCustomizerService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VisualCustomizerService } from './visual-customizer.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateVisualCustomizerDto } from '../dto/create-visual-customizer.dto';
import { VisualCustomizerLayerType } from '@prisma/client';

describe('VisualCustomizerService', () => {
  let service: VisualCustomizerService;
  let prisma: PrismaService;

  const mockPrisma = {
    visualCustomizer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    visualCustomizerLayer: {
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
        VisualCustomizerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VisualCustomizerService>(VisualCustomizerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated customizers', async () => {
      const data = [{ id: 'vc1', name: 'Customizer 1', projectId, _count: { layers: 0, presets: 0 } }];
      mockPrisma.visualCustomizer.findMany.mockResolvedValue(data);
      mockPrisma.visualCustomizer.count.mockResolvedValue(1);

      const result = await service.findAll(projectId, { page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.visualCustomizer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return customizer when found', async () => {
      const customizer = {
        id: 'vc1',
        name: 'Customizer',
        projectId,
        layers: [],
        presets: [],
        _count: {},
      };
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(customizer);

      const result = await service.findOne('vc1', projectId);

      expect(result).toEqual(customizer);
      expect(mockPrisma.visualCustomizer.findFirst).toHaveBeenCalledWith({
        where: { id: 'vc1', projectId },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when customizer not found', async () => {
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', projectId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing', projectId)).rejects.toThrow(
        /Visual customizer with ID missing not found/,
      );
    });
  });

  describe('create', () => {
    it('should create customizer when project exists', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: projectId });
      const dto: CreateVisualCustomizerDto = {
        name: 'New Customizer',
        canvasConfig: { width: 800, height: 1000 },
      };
      const created = { id: 'vc1', name: dto.name, projectId };
      mockPrisma.visualCustomizer.create.mockResolvedValue(created);

      const result = await service.create(projectId, dto);

      expect(result).toEqual(created);
      expect(mockPrisma.visualCustomizer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: dto.name, projectId }),
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create('missing', { name: 'VC', canvasConfig: {} }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('missing', { name: 'VC', canvasConfig: {} }),
      ).rejects.toThrow(/Project with ID missing not found/);
    });
  });

  describe('update', () => {
    it('should update customizer', async () => {
      const existing = { id: 'vc1', projectId, layers: [], presets: [], _count: {} };
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(existing);
      const updated = { id: 'vc1', name: 'Updated' };
      mockPrisma.visualCustomizer.update.mockResolvedValue(updated);

      const result = await service.update('vc1', projectId, { name: 'Updated' } as any);

      expect(result).toEqual(updated);
      expect(mockPrisma.visualCustomizer.update).toHaveBeenCalledWith({
        where: { id: 'vc1' },
        data: { name: 'Updated' },
        select: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should delete customizer', async () => {
      const existing = { id: 'vc1', projectId, layers: [], presets: [], _count: {} };
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(existing);
      mockPrisma.visualCustomizer.delete.mockResolvedValue({});

      const result = await service.remove('vc1', projectId);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.visualCustomizer.delete).toHaveBeenCalledWith({
        where: { id: 'vc1' },
      });
    });
  });

  describe('addLayer', () => {
    it('should add layer to customizer', async () => {
      const existing = { id: 'vc1', projectId, layers: [], presets: [], _count: {} };
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(existing);
      const layer = {
        id: 'layer1',
        name: 'Background',
        type: VisualCustomizerLayerType.IMAGE,
        customizerId: 'vc1',
      };
      mockPrisma.visualCustomizerLayer.create.mockResolvedValue(layer);

      const result = await service.addLayer(
        'vc1',
        projectId,
        { name: 'Background', type: VisualCustomizerLayerType.IMAGE, config: {} } as any,
      );

      expect(result).toEqual(layer);
      expect(mockPrisma.visualCustomizerLayer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'Background', customizerId: 'vc1' }),
        select: expect.any(Object),
      });
    });
  });

  describe('removeLayer', () => {
    it('should remove layer', async () => {
      const existing = { id: 'vc1', projectId, layers: [], presets: [], _count: {} };
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(existing);
      mockPrisma.visualCustomizerLayer.delete.mockResolvedValue({});

      const result = await service.removeLayer('vc1', projectId, 'layer1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.visualCustomizerLayer.delete).toHaveBeenCalledWith({
        where: { id: 'layer1' },
      });
    });
  });
});
