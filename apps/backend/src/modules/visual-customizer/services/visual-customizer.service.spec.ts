/**
 * VisualCustomizerService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { VisualCustomizerService } from './visual-customizer.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateCustomizerDto } from '../dto/configuration/create-customizer.dto';
import { UpdateCustomizerDto } from '../dto/configuration/update-customizer.dto';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';

describe('VisualCustomizerService', () => {
  let service: VisualCustomizerService;
  let prisma: PrismaService;

  const mockPrisma = {
    visualCustomizer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockUser: CurrentUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: UserRole.BRAND_USER,
    brandId: 'brand-1',
  };

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
    it('should return paginated list of customizers', async () => {
      const customizers = [
        {
          id: 'customizer-1',
          name: 'Customizer 1',
          brandId: 'brand-1',
          _count: { zones: 2, presets: 3, sessions: 5 },
        },
        {
          id: 'customizer-2',
          name: 'Customizer 2',
          brandId: 'brand-1',
          _count: { zones: 1, presets: 2, sessions: 3 },
        },
      ];

      mockPrisma.visualCustomizer.findMany.mockResolvedValue(customizers);
      mockPrisma.visualCustomizer.count.mockResolvedValue(2);

      const result = await service.findAll('brand-1', { page: 1, limit: 10 });

      expect(result.data).toEqual(customizers);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(mockPrisma.visualCustomizer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brandId: 'brand-1',
            deletedAt: null,
          }),
        }),
      );
    });

    it('should filter by brandId', async () => {
      mockPrisma.visualCustomizer.findMany.mockResolvedValue([]);
      mockPrisma.visualCustomizer.count.mockResolvedValue(0);

      await service.findAll('brand-1', {});

      expect(mockPrisma.visualCustomizer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brandId: 'brand-1',
          }),
        }),
      );
    });

    it('should apply search filter', async () => {
      mockPrisma.visualCustomizer.findMany.mockResolvedValue([]);
      mockPrisma.visualCustomizer.count.mockResolvedValue(0);

      await service.findAll('brand-1', { search: 'test' });

      expect(mockPrisma.visualCustomizer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({ contains: 'test' }),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return customizer when found', async () => {
      const customizer = {
        id: 'customizer-1',
        name: 'Test Customizer',
        brandId: 'brand-1',
        zones: [],
        presets: [],
        _count: { zones: 0, presets: 0, sessions: 0, savedDesigns: 0 },
      };

      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(customizer);

      const result = await service.findOne('customizer-1', 'brand-1');

      expect(result).toEqual(customizer);
      expect(mockPrisma.visualCustomizer.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'customizer-1',
          brandId: 'brand-1',
          deletedAt: null,
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when customizer not found', async () => {
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('missing', 'brand-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('missing', 'brand-1'),
      ).rejects.toThrow(/Visual customizer with ID missing not found/);
    });
  });

  describe('create', () => {
    it('should create customizer with brandId and generate slug', async () => {
      const dto: CreateCustomizerDto = {
        name: 'New Customizer',
        description: 'Test description',
        type: 'PRODUCT',
        canvasSettings: {
          width: 800,
          height: 600,
          unit: 'PIXEL',
        },
      };

      const created = {
        id: 'customizer-1',
        name: dto.name,
        slug: 'new-customizer',
        brandId: 'brand-1',
        _count: { zones: 0, presets: 0 },
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(null);
      mockPrisma.visualCustomizer.create.mockResolvedValue(created);

      const result = await service.create(dto, mockUser);

      expect(result).toEqual(created);
      expect(mockPrisma.visualCustomizer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: dto.name,
            brandId: 'brand-1',
            slug: 'new-customizer',
            createdById: 'user-1',
          }),
        }),
      );
    });

    it('should throw BadRequestException when slug already exists', async () => {
      const dto: CreateCustomizerDto = {
        name: 'Existing Customizer',
        type: 'PRODUCT',
        canvasSettings: {
          width: 800,
          height: 600,
          unit: 'PIXEL',
        },
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue({
        id: 'existing',
      });

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dto, mockUser)).rejects.toThrow(
        /already exists/,
      );
    });
  });

  describe('update', () => {
    it('should update customizer', async () => {
      const existing = { id: 'customizer-1', brandId: 'brand-1' };
      const updated = {
        id: 'customizer-1',
        name: 'Updated Name',
        _count: { zones: 0, presets: 0 },
      };

      const dto: UpdateCustomizerDto = {
        name: 'Updated Name',
      };

      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(existing);
      mockPrisma.visualCustomizer.update.mockResolvedValue(updated);

      const result = await service.update('customizer-1', dto, mockUser);

      expect(result).toEqual(updated);
      expect(mockPrisma.visualCustomizer.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customizer not found', async () => {
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(null);

      await expect(
        service.update('missing', {} as UpdateCustomizerDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should regenerate slug when name changes', async () => {
      const existing = { id: 'customizer-1', brandId: 'brand-1' };
      const updated = {
        id: 'customizer-1',
        name: 'New Name',
        slug: 'new-name',
        _count: { zones: 0, presets: 0 },
      };

      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(existing);
      mockPrisma.visualCustomizer.update.mockResolvedValue(updated);

      await service.update('customizer-1', { name: 'New Name' }, mockUser);

      expect(mockPrisma.visualCustomizer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Name',
            slug: 'new-name',
          }),
        }),
      );
    });
  });

  describe('delete', () => {
    it('should soft delete customizer', async () => {
      const existing = { id: 'customizer-1', brandId: 'brand-1' };

      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(existing);
      mockPrisma.visualCustomizer.update.mockResolvedValue({
        id: 'customizer-1',
        deletedAt: new Date(),
      });

      const result = await service.delete('customizer-1', mockUser);

      expect(result.success).toBe(true);
      expect(result.id).toBe('customizer-1');
      expect(mockPrisma.visualCustomizer.update).toHaveBeenCalledWith({
        where: { id: 'customizer-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      });
    });

    it('should throw NotFoundException when customizer not found', async () => {
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(null);

      await expect(service.delete('missing', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('publish', () => {
    it('should set status to PUBLISHED', async () => {
      const existing = {
        id: 'customizer-1',
        brandId: 'brand-1',
        status: 'DRAFT',
      };
      const published = {
        id: 'customizer-1',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      };

      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(existing);
      mockPrisma.visualCustomizer.update.mockResolvedValue(published);

      const result = await service.publish('customizer-1', mockUser);

      expect(result.status).toBe('PUBLISHED');
      expect(result.publishedAt).toBeDefined();
      expect(mockPrisma.visualCustomizer.update).toHaveBeenCalledWith({
        where: { id: 'customizer-1' },
        data: {
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when customizer not found', async () => {
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(null);

      await expect(service.publish('missing', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('clone', () => {
    it('should deep clone customizer with zones and presets', async () => {
      const original = {
        id: 'customizer-1',
        name: 'Original',
        brandId: 'brand-1',
        description: 'Original description',
        type: 'PRODUCT',
        canvasConfig: { width: 800 },
        zones: [
          {
            id: 'zone-1',
            name: 'Zone 1',
            layers: [{ id: 'layer-1', name: 'Layer 1' }],
          },
        ],
        presets: [{ id: 'preset-1', name: 'Preset 1' }],
      };

      const cloned = {
        id: 'customizer-2',
        name: 'Cloned',
        slug: 'cloned',
        _count: { zones: 1, presets: 1 },
      };

      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(original);
      mockPrisma.visualCustomizer.create.mockResolvedValue(cloned);

      const result = await service.clone(
        'customizer-1',
        'Cloned',
        mockUser,
      );

      expect(result).toEqual(cloned);
      expect(mockPrisma.visualCustomizer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Cloned',
            brandId: 'brand-1',
            status: 'DRAFT',
            zones: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({
                  name: 'Zone 1',
                  layers: expect.objectContaining({
                    create: expect.arrayContaining([
                      expect.objectContaining({ name: 'Layer 1' }),
                    ]),
                  }),
                }),
              ]),
            }),
            presets: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ name: 'Preset 1' }),
              ]),
            }),
          }),
        }),
      );
    });

    it('should throw NotFoundException when customizer not found', async () => {
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(null);

      await expect(
        service.clone('missing', 'Cloned', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
