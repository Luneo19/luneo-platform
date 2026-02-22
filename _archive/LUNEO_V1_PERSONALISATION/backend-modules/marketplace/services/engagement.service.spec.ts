import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('EngagementService', () => {
  let service: EngagementService;

  const mockPrismaService = {
    templateLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    marketplaceTemplate: {
      update: jest.fn(),
    },
    creatorFollow: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    creatorProfile: {
      update: jest.fn(),
    },
    templateReview: {
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    templateFavorite: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngagementService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EngagementService>(EngagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toggleLike', () => {
    it('should throw BadRequestException when templateId is empty', async () => {
      await expect(service.toggleLike('', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.toggleLike('', 'user-1')).rejects.toThrow(
        'Template ID is required',
      );
    });

    it('should throw BadRequestException when userId is empty', async () => {
      await expect(service.toggleLike('tpl-1', '')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.toggleLike('tpl-1', '')).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should add like and return liked: true when like does not exist', async () => {
      mockPrismaService.templateLike.findUnique.mockResolvedValue(null);
      mockPrismaService.templateLike.create.mockResolvedValue({});
      mockPrismaService.marketplaceTemplate.update.mockResolvedValue({
        likes: 1,
      });

      const result = await service.toggleLike('tpl-1', 'user-1');

      expect(result).toEqual({ liked: true, likesCount: 1 });
      expect(mockPrismaService.templateLike.create).toHaveBeenCalledWith({
        data: { templateId: 'tpl-1', userId: 'user-1' },
      });
      expect(mockPrismaService.marketplaceTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      });
    });

    it('should remove like and return liked: false when like exists', async () => {
      mockPrismaService.templateLike.findUnique.mockResolvedValue({
        templateId: 'tpl-1',
        userId: 'user-1',
      });
      mockPrismaService.templateLike.delete.mockResolvedValue({});
      mockPrismaService.marketplaceTemplate.update
        .mockResolvedValueOnce({ likes: 0 })
        .mockResolvedValueOnce({});

      const result = await service.toggleLike('tpl-1', 'user-1');

      expect(result).toEqual({ liked: false, likesCount: 0 });
      expect(mockPrismaService.templateLike.delete).toHaveBeenCalled();
      expect(mockPrismaService.marketplaceTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { likes: { decrement: 1 } } }),
      );
    });
  });

  describe('toggleFollow', () => {
    it('should throw BadRequestException when followerId is empty', async () => {
      await expect(service.toggleFollow('', 'creator-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when followingId is empty', async () => {
      await expect(service.toggleFollow('user-1', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when following self', async () => {
      await expect(service.toggleFollow('user-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.toggleFollow('user-1', 'user-1')).rejects.toThrow(
        'Cannot follow yourself',
      );
    });

    it('should add follow and return following: true when follow does not exist', async () => {
      mockPrismaService.creatorFollow.findUnique.mockResolvedValue(null);
      mockPrismaService.creatorFollow.create.mockResolvedValue({});
      mockPrismaService.creatorProfile.update.mockResolvedValue({
        followersCount: 10,
      });

      const result = await service.toggleFollow('user-1', 'creator-1');

      expect(result).toEqual({ following: true, followersCount: 10 });
      expect(mockPrismaService.creatorFollow.create).toHaveBeenCalledWith({
        data: { followerId: 'user-1', followingId: 'creator-1' },
      });
    });

    it('should remove follow and return following: false when follow exists', async () => {
      mockPrismaService.creatorFollow.findUnique.mockResolvedValue({});
      mockPrismaService.creatorFollow.delete.mockResolvedValue({});
      mockPrismaService.creatorProfile.update.mockResolvedValue({
        followersCount: 9,
      });

      const result = await service.toggleFollow('user-1', 'creator-1');

      expect(result).toEqual({ following: false, followersCount: 9 });
      expect(mockPrismaService.creatorFollow.delete).toHaveBeenCalled();
    });
  });

  describe('createOrUpdateReview', () => {
    it('should throw BadRequestException when templateId is empty', async () => {
      await expect(
        service.createOrUpdateReview({
          templateId: '',
          userId: 'user-1',
          rating: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when rating is out of range', async () => {
      await expect(
        service.createOrUpdateReview({
          templateId: 'tpl-1',
          userId: 'user-1',
          rating: 0,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateReview({
          templateId: 'tpl-1',
          userId: 'user-1',
          rating: 6,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateReview({
          templateId: 'tpl-1',
          userId: 'user-1',
          rating: 3,
        }),
      ).resolves;
    });

    it('should upsert review and return review', async () => {
      const review = {
        id: 'rev-1',
        templateId: 'tpl-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Great template',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.templateReview.upsert.mockResolvedValue(review);
      mockPrismaService.templateReview.aggregate.mockResolvedValue({ _avg: { rating: 5 } });
      mockPrismaService.templateReview.count.mockResolvedValue(1);
      mockPrismaService.marketplaceTemplate.update.mockResolvedValue({});

      const result = await service.createOrUpdateReview({
        templateId: 'tpl-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Great template',
      });

      expect(result).toEqual(review);
      expect(mockPrismaService.templateReview.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            templateId_userId: { templateId: 'tpl-1', userId: 'user-1' },
          },
          update: { rating: 5, comment: 'Great template' },
          create: expect.objectContaining({
            templateId: 'tpl-1',
            userId: 'user-1',
            rating: 5,
          }),
        }),
      );
    });
  });

  describe('toggleFavorite', () => {
    it('should throw BadRequestException when templateId is empty', async () => {
      await expect(service.toggleFavorite('', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should add to favorites and return favorited: true when not in favorites', async () => {
      mockPrismaService.templateFavorite.findUnique.mockResolvedValue(null);
      mockPrismaService.templateFavorite.create.mockResolvedValue({});

      const result = await service.toggleFavorite('tpl-1', 'user-1');

      expect(result).toEqual({ favorited: true });
      expect(mockPrismaService.templateFavorite.create).toHaveBeenCalled();
    });

    it('should remove from favorites and return favorited: false when in favorites', async () => {
      mockPrismaService.templateFavorite.findUnique.mockResolvedValue({});
      mockPrismaService.templateFavorite.delete.mockResolvedValue({});

      const result = await service.toggleFavorite('tpl-1', 'user-1');

      expect(result).toEqual({ favorited: false });
      expect(mockPrismaService.templateFavorite.delete).toHaveBeenCalled();
    });
  });
});
