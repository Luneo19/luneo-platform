/**
 * Configurator3DOptionsService unit tests
 * Constructor: prisma
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Configurator3DOptionsService } from './configurator-3d-options.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { CreateOptionDto } from '../dto/options/create-option.dto';
import type { UpdateOptionDto } from '../dto/options/update-option.dto';
import type { BulkCreateOptionsDto } from '../dto/options/bulk-create-options.dto';

describe('Configurator3DOptionsService', () => {
  let service: Configurator3DOptionsService;
  let prisma: PrismaService;

  const configurationId = 'cfg-1';
  const componentId = 'comp-1';
  const optionId = 'opt-1';

  const mockPrisma = {
    configurator3DOption: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createManyAndReturn: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DOptionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<Configurator3DOptionsService>(Configurator3DOptionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create option', async () => {
      const dto = {
        name: 'Midnight Black',
        type: 'COLOR',
        value: { hex: '#000000' },
      } as Omit<CreateOptionDto, 'componentId'>;
      const created = { id: optionId, configurationId, componentId, name: dto.name };
      mockPrisma.configurator3DOption.create.mockResolvedValue(created);

      const result = await service.create(configurationId, componentId, dto);

      expect(result).toEqual(created);
      expect(mockPrisma.configurator3DOption.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configurationId,
          componentId,
          name: 'Midnight Black',
          type: 'COLOR',
          sortOrder: 0,
          isDefault: false,
          isEnabled: true,
        }),
      });
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple options via createManyAndReturn', async () => {
      const dto: BulkCreateOptionsDto = {
        options: [
          { name: 'Opt1', type: 'COLOR', value: {}, componentId },
          { name: 'Opt2', type: 'COLOR', value: {}, componentId },
        ],
      };
      const created = [
        { id: 'opt1', name: 'Opt1', configurationId, componentId },
        { id: 'opt2', name: 'Opt2', configurationId, componentId },
      ];
      mockPrisma.configurator3DOption.createManyAndReturn.mockResolvedValue(created);

      const result = await service.bulkCreate(configurationId, componentId, dto);

      expect(result).toEqual(created);
      expect(mockPrisma.configurator3DOption.createManyAndReturn).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Opt1', componentId, configurationId }),
          expect.objectContaining({ name: 'Opt2', componentId, configurationId }),
        ]),
      });
    });
  });

  describe('findAll', () => {
    it('should return options for configuration and component', async () => {
      const options = [
        { id: 'opt1', name: 'O1', sortOrder: 0 },
        { id: 'opt2', name: 'O2', sortOrder: 1 },
      ];
      mockPrisma.configurator3DOption.findMany.mockResolvedValue(options);

      const result = await service.findAll(configurationId, componentId);

      expect(result).toEqual(options);
      expect(mockPrisma.configurator3DOption.findMany).toHaveBeenCalledWith({
        where: { configurationId, componentId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return option when found', async () => {
      const option = { id: optionId, configurationId, componentId, name: 'Black' };
      mockPrisma.configurator3DOption.findFirst.mockResolvedValue(option);

      const result = await service.findOne(configurationId, componentId, optionId);

      expect(result).toEqual(option);
      expect(mockPrisma.configurator3DOption.findFirst).toHaveBeenCalledWith({
        where: { id: optionId, configurationId, componentId },
      });
    });

    it('should throw NotFoundException when option not found', async () => {
      mockPrisma.configurator3DOption.findFirst.mockResolvedValue(null);

      await expect(service.findOne(configurationId, componentId, 'missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(configurationId, componentId, 'missing')).rejects.toThrow(
        /Option with ID missing not found/,
      );
    });
  });

  describe('update', () => {
    it('should update option', async () => {
      mockPrisma.configurator3DOption.findFirst.mockResolvedValue({
        id: optionId,
        configurationId,
        componentId,
      });
      const updated = { id: optionId, name: 'Updated Name' };
      mockPrisma.configurator3DOption.update.mockResolvedValue(updated);

      const dto: UpdateOptionDto = { name: 'Updated Name' } as UpdateOptionDto;
      const result = await service.update(configurationId, componentId, optionId, dto);

      expect(result).toEqual(updated);
      expect(mockPrisma.configurator3DOption.update).toHaveBeenCalledWith({
        where: { id: optionId },
        data: dto,
      });
    });

    it('should throw NotFoundException when option not found', async () => {
      mockPrisma.configurator3DOption.findFirst.mockResolvedValue(null);

      await expect(
        service.update(configurationId, componentId, 'missing', { name: 'X' } as UpdateOptionDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete option', async () => {
      mockPrisma.configurator3DOption.findFirst.mockResolvedValue({
        id: optionId,
        configurationId,
        componentId,
      });
      mockPrisma.configurator3DOption.delete.mockResolvedValue({});

      const result = await service.delete(configurationId, componentId, optionId);

      expect(result).toEqual({ success: true, id: optionId });
      expect(mockPrisma.configurator3DOption.delete).toHaveBeenCalledWith({ where: { id: optionId } });
    });

    it('should throw NotFoundException when option not found', async () => {
      mockPrisma.configurator3DOption.findFirst.mockResolvedValue(null);

      await expect(service.delete(configurationId, componentId, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
