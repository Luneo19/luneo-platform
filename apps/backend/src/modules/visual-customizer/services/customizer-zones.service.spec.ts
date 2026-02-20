/**
 * CustomizerZonesService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CustomizerZonesService } from './customizer-zones.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateZoneDto } from '../dto/zones/create-zone.dto';
import { UpdateZoneDto } from '../dto/zones/update-zone.dto';
import { ReorderZonesDto } from '../dto/zones/reorder-zones.dto';
import { VISUAL_CUSTOMIZER_LIMITS } from '../visual-customizer.constants';
import { ZoneType2D, ZoneShape } from '@prisma/client';

describe('CustomizerZonesService', () => {
  let service: CustomizerZonesService;
  let _prisma: PrismaService;

  const mockPrisma = {
    visualCustomizer: {
      findUnique: jest.fn(),
    },
    customizerZone: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomizerZonesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomizerZonesService>(CustomizerZonesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create zone', async () => {
      const customizerId = 'customizer-1';
      const dto: CreateZoneDto = {
        customizerId,
        name: 'Zone 1',
        type: ZoneType2D.EDITABLE,
        shape: ZoneShape.RECTANGLE,
        bounds: {
          x: 10,
          y: 20,
          width: 100,
          height: 50,
        },
      };

      const created = {
        id: 'zone-1',
        customizerId,
        name: 'Zone 1',
        _count: { layers: 0 },
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue({
        id: customizerId,
      });
      mockPrisma.customizerZone.count.mockResolvedValue(0);
      mockPrisma.customizerZone.findFirst.mockResolvedValue(null);
      mockPrisma.customizerZone.create.mockResolvedValue(created);

      const result = await service.create(customizerId, dto);

      expect(result).toEqual(created);
      expect(mockPrisma.customizerZone.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customizerId,
            name: 'Zone 1',
            x: 10,
            y: 20,
            width: 100,
            height: 50,
          }),
        }),
      );
    });

    it('should throw NotFoundException when customizer not found', async () => {
      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(null);

      await expect(
        service.create('missing', {} as CreateZoneDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate max zones limit', async () => {
      const customizerId = 'customizer-1';
      const dto: CreateZoneDto = {
        customizerId,
        name: 'Zone 1',
        type: ZoneType2D.EDITABLE,
        shape: ZoneShape.RECTANGLE,
        bounds: { x: 0, y: 0, width: 100, height: 100 },
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue({
        id: customizerId,
      });
      mockPrisma.customizerZone.count.mockResolvedValue(
        VISUAL_CUSTOMIZER_LIMITS.MAX_ZONES_PER_CUSTOMIZER,
      );

      await expect(service.create(customizerId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(customizerId, dto)).rejects.toThrow(
        /Maximum.*zones allowed/,
      );
    });

    it('should set correct sortOrder for new zone', async () => {
      const customizerId = 'customizer-1';
      const dto: CreateZoneDto = {
        customizerId,
        name: 'Zone 1',
        type: ZoneType2D.EDITABLE,
        shape: ZoneShape.RECTANGLE,
        bounds: { x: 0, y: 0, width: 100, height: 100 },
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue({
        id: customizerId,
      });
      mockPrisma.customizerZone.count.mockResolvedValue(2);
      mockPrisma.customizerZone.findFirst.mockResolvedValue({
        sortOrder: 4,
      });
      mockPrisma.customizerZone.create.mockResolvedValue({
        id: 'zone-1',
        sortOrder: 5,
      });

      await service.create(customizerId, dto);

      expect(mockPrisma.customizerZone.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sortOrder: 5,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return ordered zones', async () => {
      const customizerId = 'customizer-1';
      const zones = [
        { id: 'zone-1', sortOrder: 0, _count: { layers: 2 } },
        { id: 'zone-2', sortOrder: 1, _count: { layers: 1 } },
      ];

      mockPrisma.customizerZone.findMany.mockResolvedValue(zones);

      const result = await service.findAll(customizerId);

      expect(result).toEqual(zones);
      expect(mockPrisma.customizerZone.findMany).toHaveBeenCalledWith({
        where: { customizerId },
        orderBy: { sortOrder: 'asc' },
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update zone fields', async () => {
      const zoneId = 'zone-1';
      const customizerId = 'customizer-1';
      const dto: UpdateZoneDto = {
        name: 'Updated Zone',
        bounds: {
          x: 20,
          y: 30,
          width: 150,
          height: 75,
        },
      };

      const existing = { id: zoneId, customizerId };
      const updated = {
        id: zoneId,
        name: 'Updated Zone',
        _count: { layers: 0 },
      };

      mockPrisma.customizerZone.findFirst.mockResolvedValue(existing);
      mockPrisma.customizerZone.update.mockResolvedValue(updated);

      const result = await service.update(zoneId, customizerId, dto);

      expect(result).toEqual(updated);
      expect(mockPrisma.customizerZone.update).toHaveBeenCalledWith({
        where: { id: zoneId },
        data: expect.objectContaining({
          name: 'Updated Zone',
          x: 20,
          y: 30,
          width: 150,
          height: 75,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when zone not found', async () => {
      mockPrisma.customizerZone.findFirst.mockResolvedValue(null);

      await expect(
        service.update('missing', 'customizer-1', {} as UpdateZoneDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete zone', async () => {
      const zoneId = 'zone-1';
      const customizerId = 'customizer-1';
      const existing = { id: zoneId, customizerId };

      mockPrisma.customizerZone.findFirst.mockResolvedValue(existing);
      mockPrisma.customizerZone.delete.mockResolvedValue({});

      const result = await service.delete(zoneId, customizerId);

      expect(result.success).toBe(true);
      expect(result.id).toBe(zoneId);
      expect(mockPrisma.customizerZone.delete).toHaveBeenCalledWith({
        where: { id: zoneId },
      });
    });

    it('should throw NotFoundException when zone not found', async () => {
      mockPrisma.customizerZone.findFirst.mockResolvedValue(null);

      await expect(
        service.delete('missing', 'customizer-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('should reorder zones by sortOrder', async () => {
      const customizerId = 'customizer-1';
      const dto: ReorderZonesDto = {
        zoneIds: ['zone-3', 'zone-1', 'zone-2'],
      };

      mockPrisma.customizerZone.findMany.mockResolvedValue([
        { id: 'zone-3' },
        { id: 'zone-1' },
        { id: 'zone-2' },
      ]);
      mockPrisma.customizerZone.update.mockResolvedValue({});

      const result = await service.reorder(customizerId, dto);

      expect(result.success).toBe(true);
      expect(result.zoneIds).toEqual(dto.zoneIds);
      expect(mockPrisma.customizerZone.update).toHaveBeenCalledTimes(3);
      expect(mockPrisma.customizerZone.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'zone-3' },
        data: { sortOrder: 0 },
      });
      expect(mockPrisma.customizerZone.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'zone-1' },
        data: { sortOrder: 1 },
      });
      expect(mockPrisma.customizerZone.update).toHaveBeenNthCalledWith(3, {
        where: { id: 'zone-2' },
        data: { sortOrder: 2 },
      });
    });

    it('should throw BadRequestException when some zones do not belong to customizer', async () => {
      const customizerId = 'customizer-1';
      const dto: ReorderZonesDto = {
        zoneIds: ['zone-1', 'zone-2', 'zone-invalid'],
      };

      mockPrisma.customizerZone.findMany.mockResolvedValue([
        { id: 'zone-1' },
        { id: 'zone-2' },
      ]);

      await expect(service.reorder(customizerId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.reorder(customizerId, dto)).rejects.toThrow(
        /do not belong to this customizer/,
      );
    });
  });
});
