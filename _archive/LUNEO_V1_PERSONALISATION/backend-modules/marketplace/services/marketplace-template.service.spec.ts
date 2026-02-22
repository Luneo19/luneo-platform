import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MarketplaceTemplateService } from './marketplace-template.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import type { CreateMarketplaceTemplateData } from './marketplace-template.service';

describe('MarketplaceTemplateService', () => {
  let service: MarketplaceTemplateService;

  const mockPrismaService = {
    marketplaceTemplate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    getOrSet: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceTemplateService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SmartCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<MarketplaceTemplateService>(MarketplaceTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTemplate', () => {
    const validData: CreateMarketplaceTemplateData = {
      creatorId: 'creator-1',
      name: 'My Template',
      slug: 'my-template',
      promptTemplate: 'Generate a {{style}} design',
    };

    it('should throw BadRequestException when creatorId is empty', async () => {
      await expect(
        service.createTemplate({ ...validData, creatorId: '' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createTemplate({ ...validData, creatorId: '' }),
      ).rejects.toThrow('Creator ID is required');
    });

    it('should throw BadRequestException when name is empty', async () => {
      await expect(
        service.createTemplate({ ...validData, name: '' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createTemplate({ ...validData, name: '' }),
      ).rejects.toThrow('Template name is required');
    });

    it('should throw BadRequestException when slug is invalid', async () => {
      await expect(
        service.createTemplate({ ...validData, slug: 'ab' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createTemplate({ ...validData, slug: 'ab' }),
      ).rejects.toThrow(/Slug must be 3-100/);

      await expect(
        service.createTemplate({ ...validData, slug: 'Invalid_Slug' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when promptTemplate is empty', async () => {
      await expect(
        service.createTemplate({ ...validData, promptTemplate: '' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createTemplate({ ...validData, promptTemplate: '' }),
      ).rejects.toThrow('Prompt template is required');
    });

    it('should throw BadRequestException when slug already taken', async () => {
      mockPrismaService.marketplaceTemplate.findUnique.mockResolvedValue({
        id: 'existing',
        slug: 'my-template',
      });

      await expect(service.createTemplate(validData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createTemplate(validData)).rejects.toThrow(
        'Slug already taken',
      );
    });

    it('should create template and return it', async () => {
      mockPrismaService.marketplaceTemplate.findUnique.mockResolvedValue(null);
      const created = {
        id: 'tpl-1',
        creatorId: 'creator-1',
        name: 'My Template',
        slug: 'my-template',
        description: null,
        category: null,
        tags: [],
        promptTemplate: 'Generate a {{style}} design',
        negativePrompt: null,
        variables: null,
        exampleOutputs: [],
        aiProvider: 'openai',
        model: 'dall-e-3',
        quality: 'standard',
        style: 'natural',
        priceCents: 0,
        isFree: true,
        revenueSharePercent: 70,
        downloads: 0,
        likes: 0,
        reviews: 0,
        averageRating: 0,
        totalRevenueCents: 0,
        status: 'draft',
        publishedAt: null,
        featured: false,
        thumbnailUrl: null,
        previewImages: [],
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.marketplaceTemplate.create.mockResolvedValue(created);

      const result = await service.createTemplate(validData);

      expect(result).toBeDefined();
      expect(result.slug).toBe('my-template');
      expect(result.name).toBe('My Template');
      expect(mockPrismaService.marketplaceTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatorId: 'creator-1',
            name: 'My Template',
            slug: 'my-template',
            promptTemplate: 'Generate a {{style}} design',
            status: 'draft',
          }),
        }),
      );
    });
  });

  describe('getTemplateBySlug', () => {
    it('should throw BadRequestException when slug is empty', async () => {
      await expect(service.getTemplateBySlug('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getTemplateBySlug('')).rejects.toThrow(
        'Slug is required',
      );
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrismaService.marketplaceTemplate.findUnique.mockResolvedValue(null);

      await expect(service.getTemplateBySlug('missing-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getTemplateBySlug('missing-slug')).rejects.toThrow(
        /Template not found/,
      );
    });

    it('should return template when found', async () => {
      const template = {
        id: 'tpl-1',
        slug: 'my-template',
        name: 'My Template',
        creatorId: 'creator-1',
        promptTemplate: 'Prompt',
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.marketplaceTemplate.findUnique.mockResolvedValue(template);

      const result = await service.getTemplateBySlug('my-template');

      expect(result).toEqual(template);
      expect(mockPrismaService.marketplaceTemplate.findUnique).toHaveBeenCalledWith(
        { where: { slug: 'my-template' } },
      );
    });
  });

  describe('searchTemplates', () => {
    it('should return paginated templates with default options', async () => {
      const templates = [
        {
          id: 'tpl-1',
          slug: 't1',
          name: 'T1',
          creatorId: 'c1',
          status: 'published',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.marketplaceTemplate.count.mockResolvedValue(1);
      mockPrismaService.marketplaceTemplate.findMany.mockResolvedValue(templates);

      const result = await service.searchTemplates({});

      expect(result.templates).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockPrismaService.marketplaceTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should filter by category and sort by rating', async () => {
      mockPrismaService.marketplaceTemplate.count.mockResolvedValue(0);
      mockPrismaService.marketplaceTemplate.findMany.mockResolvedValue([]);

      await service.searchTemplates({
        category: 'footwear',
        sortBy: 'rating',
        page: 2,
        limit: 10,
      });

      expect(mockPrismaService.marketplaceTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            category: 'footwear',
          }),
          orderBy: [{ averageRating: 'desc' }, { reviews: 'desc' }],
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('publishTemplate', () => {
    it('should throw BadRequestException when templateId is empty', async () => {
      await expect(service.publishTemplate('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publishTemplate('')).rejects.toThrow(
        'Template ID is required',
      );
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrismaService.marketplaceTemplate.findUnique.mockResolvedValue(null);

      await expect(service.publishTemplate('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.publishTemplate('missing-id')).rejects.toThrow(
        /not found/,
      );
    });

    it('should update template to published', async () => {
      mockPrismaService.marketplaceTemplate.findUnique.mockResolvedValue({
        id: 'tpl-1',
        status: 'draft',
      });
      const updated = {
        id: 'tpl-1',
        status: 'published',
        publishedAt: new Date(),
      };
      mockPrismaService.marketplaceTemplate.update.mockResolvedValue(updated);

      const result = await service.publishTemplate('tpl-1');

      expect(result.status).toBe('published');
      expect(result.publishedAt).toBeDefined();
      expect(mockPrismaService.marketplaceTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
        data: {
          status: 'published',
          publishedAt: expect.any(Date),
        },
      });
    });
  });
});
