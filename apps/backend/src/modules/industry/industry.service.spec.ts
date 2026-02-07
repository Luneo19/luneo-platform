/**
 * IndustryService - Unit tests
 * Tests for industry CRUD and config
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IndustryService } from './industry.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';

describe('IndustryService', () => {
  let service: IndustryService;
  let prisma: jest.Mocked<PrismaService>;

  const mockIndustry = {
    id: 'ind-1',
    slug: 'jewelry',
    labelFr: 'Bijouterie',
    labelEn: 'Jewelry',
    icon: 'gem',
    accentColor: '#8B5CF6',
    description: 'Jewelry industry',
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConfigData = {
    moduleConfigs: [{ id: 'mc1', moduleSlug: 'catalog', sortOrder: 0 }],
    widgetConfigs: [{ id: 'wc1', widgetSlug: 'revenue', position: 0 }],
    kpiConfigs: [{ id: 'kc1', kpiSlug: 'monthly-revenue', sortOrder: 0 }],
    terminology: [{ id: 't1', genericTerm: 'product', customTermFr: 'Création', customTermEn: 'Design' }],
  };

  beforeEach(async () => {
    const mockPrisma = {
      industry: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndustryService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<IndustryService>(IndustryService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return active industries sorted by sortOrder', async () => {
      const industries = [
        { ...mockIndustry, slug: 'jewelry', sortOrder: 0 },
        { ...mockIndustry, id: 'ind-2', slug: 'fashion', sortOrder: 1 },
      ];
      (prisma.industry.findMany as jest.Mock).mockResolvedValue(industries);

      const result = await service.getAll();

      expect(result).toEqual(industries);
      expect(prisma.industry.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('getBySlug', () => {
    it('should return industry with all relations when found', async () => {
      const industryWithRelations = {
        ...mockIndustry,
        ...mockConfigData,
        templates: [],
        onboardingSteps: [],
      };
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue(industryWithRelations);

      const result = await service.getBySlug('jewelry');

      expect(result).toEqual(industryWithRelations);
      expect(prisma.industry.findUnique).toHaveBeenCalledWith({
        where: { slug: 'jewelry', isActive: true },
        include: {
          moduleConfigs: { orderBy: { sortOrder: 'asc' } },
          widgetConfigs: { orderBy: { position: 'asc' } },
          kpiConfigs: { orderBy: { sortOrder: 'asc' } },
          templates: { orderBy: { sortOrder: 'asc' } },
          terminology: true,
          onboardingSteps: { orderBy: { stepOrder: 'asc' } },
        },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getBySlug('invalid-slug')).rejects.toThrow(NotFoundException);
      await expect(service.getBySlug('invalid-slug')).rejects.toThrow('Industry not found: invalid-slug');
    });
  });

  describe('getConfig', () => {
    it('should return only config data (modules, widgets, kpis, terminology)', async () => {
      const industryWithConfig = {
        ...mockIndustry,
        ...mockConfigData,
      };
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue(industryWithConfig);

      const result = await service.getConfig('jewelry');

      expect(result).toEqual({
        modules: mockConfigData.moduleConfigs,
        widgets: mockConfigData.widgetConfigs,
        kpis: mockConfigData.kpiConfigs,
        terminology: mockConfigData.terminology,
      });
      expect(prisma.industry.findUnique).toHaveBeenCalledWith({
        where: { slug: 'jewelry', isActive: true },
        include: {
          moduleConfigs: { orderBy: { sortOrder: 'asc' } },
          widgetConfigs: { orderBy: { position: 'asc' } },
          kpiConfigs: { orderBy: { sortOrder: 'asc' } },
          terminology: true,
        },
      });
    });

    it('should throw NotFoundException for invalid slug', async () => {
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getConfig('invalid')).rejects.toThrow(NotFoundException);
      await expect(service.getConfig('invalid')).rejects.toThrow('Industry not found: invalid');
    });
  });

  describe('create', () => {
    it('should create a new industry', async () => {
      const dto: CreateIndustryDto = {
        slug: 'jewelry',
        labelFr: 'Bijouterie',
        labelEn: 'Jewelry',
        icon: 'gem',
        accentColor: '#8B5CF6',
        description: 'Jewelry industry',
        sortOrder: 1,
      };
      (prisma.industry.create as jest.Mock).mockResolvedValue({ ...mockIndustry, ...dto });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.slug).toBe('jewelry');
      expect(prisma.industry.create).toHaveBeenCalledWith({
        data: {
          slug: dto.slug,
          labelFr: dto.labelFr,
          labelEn: dto.labelEn,
          icon: dto.icon,
          accentColor: dto.accentColor,
          description: dto.description,
          sortOrder: 1,
        },
      });
    });

    it('should use sortOrder 0 when not provided', async () => {
      const dto: CreateIndustryDto = {
        slug: 'jewelry',
        labelFr: 'Bijouterie',
        labelEn: 'Jewelry',
        icon: 'gem',
        accentColor: '#8B5CF6',
      };
      (prisma.industry.create as jest.Mock).mockResolvedValue(mockIndustry);

      await service.create(dto);

      expect(prisma.industry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sortOrder: 0 }),
      });
    });
  });

  describe('update', () => {
    it('should update an existing industry', async () => {
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue(mockIndustry);
      const updated = { ...mockIndustry, labelEn: 'Jewelry & Watches' };
      (prisma.industry.update as jest.Mock).mockResolvedValue(updated);

      const dto: UpdateIndustryDto = { labelEn: 'Jewelry & Watches' };
      const result = await service.update('jewelry', dto);

      expect(result).toEqual(updated);
      expect(prisma.industry.findUnique).toHaveBeenCalledWith({ where: { slug: 'jewelry' } });
      expect(prisma.industry.update).toHaveBeenCalledWith({
        where: { slug: 'jewelry' },
        data: expect.objectContaining({ labelEn: 'Jewelry & Watches' }),
      });
    });

    it('should throw NotFoundException when industry does not exist', async () => {
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('invalid', { labelEn: 'X' })).rejects.toThrow(NotFoundException);
      expect(prisma.industry.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft-delete (set isActive=false)', async () => {
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue(mockIndustry);
      (prisma.industry.update as jest.Mock).mockResolvedValue({ ...mockIndustry, isActive: false });

      const result = await service.delete('jewelry');

      expect(result).toEqual({ success: true });
      expect(prisma.industry.update).toHaveBeenCalledWith({
        where: { slug: 'jewelry' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when industry does not exist', async () => {
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('invalid')).rejects.toThrow(NotFoundException);
      expect(prisma.industry.update).not.toHaveBeenCalled();
    });
  });
});
