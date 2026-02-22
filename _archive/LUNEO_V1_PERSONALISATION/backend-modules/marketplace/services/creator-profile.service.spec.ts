/**
 * @fileoverview Tests unitaires pour CreatorProfileService
 * @module CreatorProfileService.spec
 *
 * Conforme au plan PHASE 9 - Tests & CI/CD
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatorProfileService } from './creator-profile.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

describe('CreatorProfileService', () => {
  let service: CreatorProfileService;
  let prismaService: Record<string, unknown>;
  let _cacheService: jest.Mocked<SmartCacheService>;

  const mockUser = {
    id: 'user-123',
    email: 'creator@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockProfile = {
    id: 'profile-123',
    userId: 'user-123',
    username: 'johndoe',
    displayName: 'John Doe',
    bio: 'Creative designer',
    verified: false,
    status: 'active',
    templatesCount: 0,
    totalSales: 0,
    totalEarningsCents: 0,
    followersCount: 0,
    followingCount: 0,
    averageRating: 0,
    payoutEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      creatorProfile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $queryRawUnsafe: jest.fn(),
      $executeRaw: jest.fn(),
      $executeRawUnsafe: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidateTags: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorProfileService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SmartCacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<CreatorProfileService>(CreatorProfileService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(SmartCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    const validData = {
      userId: 'user-123',
      username: 'johndoe',
      displayName: 'John Doe',
      bio: 'Creative designer',
    };

    it('should create profile with valid data', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      // No existing profile with this username
      prismaService.creatorProfile.findUnique.mockResolvedValue(null);
      prismaService.creatorProfile.create.mockResolvedValue(mockProfile);

      const result = await service.createProfile(validData);

      expect(result).toBeDefined();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: validData.userId },
      });
      expect(prismaService.creatorProfile.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(
        service.createProfile({ ...validData, userId: '' } as unknown),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when username is invalid', async () => {
      await expect(
        service.createProfile({ ...validData, username: 'ab' } as unknown), // Trop court
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when username contains invalid characters', async () => {
      await expect(
        service.createProfile({ ...validData, username: 'john@doe' } as unknown),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createProfile(validData)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when username is already taken', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.creatorProfile.findUnique.mockResolvedValue({ id: 'existing-profile', username: 'johndoe' });

      await expect(service.createProfile(validData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfileByUserId', () => {
    it('should return profile when user exists', async () => {
      prismaService.creatorProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfileByUserId('user-123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
    });

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.getProfileByUserId('')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      prismaService.creatorProfile.findUnique.mockResolvedValue(null);

      await expect(service.getProfileByUserId('user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfileByUsername', () => {
    it('should return profile when username exists', async () => {
      prismaService.creatorProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfileByUsername('johndoe');

      expect(result).toBeDefined();
      expect(result.username).toBe('johndoe');
    });

    it('should throw NotFoundException when username does not exist', async () => {
      prismaService.creatorProfile.findUnique.mockResolvedValue(null);

      await expect(service.getProfileByUsername('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile with valid data', async () => {
      const updatedProfile = { ...mockProfile, displayName: 'John Updated', bio: 'Updated bio' };
      prismaService.creatorProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.creatorProfile.update.mockResolvedValue(updatedProfile);

      const updateData = {
        displayName: 'John Updated',
        bio: 'Updated bio',
      };

      const result = await service.updateProfile('user-123', updateData);

      expect(result).toBeDefined();
      expect(prismaService.creatorProfile.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.updateProfile('', { displayName: 'Test' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyCreator', () => {
    it('should verify creator successfully', async () => {
      const verifiedProfile = { ...mockProfile, verified: true, verifiedAt: new Date() };
      prismaService.creatorProfile.update.mockResolvedValue(verifiedProfile);

      const result = await service.verifyCreator('user-123', true);

      expect(result).toBeDefined();
      expect(result.verified).toBe(true);
      expect(prismaService.creatorProfile.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.verifyCreator('', true)).rejects.toThrow(BadRequestException);
    });
  });
});
