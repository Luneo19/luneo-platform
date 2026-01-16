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
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<SmartCacheService>;

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
      $queryRaw: jest.fn(),
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
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.$queryRaw.mockResolvedValue([]);
      prismaService.$executeRaw.mockResolvedValue([mockProfile] as any);
      prismaService.$queryRawUnsafe.mockResolvedValue([mockProfile] as any);

      const result = await service.createProfile(validData);

      expect(result).toBeDefined();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: validData.userId },
      });
    });

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(
        service.createProfile({ ...validData, userId: '' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when username is invalid', async () => {
      await expect(
        service.createProfile({ ...validData, username: 'ab' } as any), // Trop court
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when username contains invalid characters', async () => {
      await expect(
        service.createProfile({ ...validData, username: 'john@doe' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createProfile(validData)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when username is already taken', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.$queryRaw.mockResolvedValue([{ id: 'existing-profile' }] as any);

      await expect(service.createProfile(validData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfileByUserId', () => {
    it('should return profile when user exists', async () => {
      prismaService.$queryRawUnsafe.mockResolvedValue([mockProfile] as any);

      const result = await service.getProfileByUserId('user-123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
    });

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.getProfileByUserId('')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      prismaService.$queryRawUnsafe.mockResolvedValue([]);

      await expect(service.getProfileByUserId('user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfileByUsername', () => {
    it('should return profile when username exists', async () => {
      prismaService.$queryRawUnsafe.mockResolvedValue([mockProfile] as any);

      const result = await service.getProfileByUsername('johndoe');

      expect(result).toBeDefined();
      expect(result.username).toBe('johndoe');
    });

    it('should throw NotFoundException when username does not exist', async () => {
      prismaService.$queryRawUnsafe.mockResolvedValue([]);

      await expect(service.getProfileByUsername('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile with valid data', async () => {
      prismaService.$queryRawUnsafe
        .mockResolvedValueOnce([mockProfile] as any) // getProfileByUserId
        .mockResolvedValueOnce([mockProfile] as any) // getProfileByUserId after update
        .mockResolvedValueOnce(undefined); // executeRawUnsafe

      const updateData = {
        displayName: 'John Updated',
        bio: 'Updated bio',
      };

      const result = await service.updateProfile('user-123', updateData);

      expect(result).toBeDefined();
      expect(prismaService.$executeRawUnsafe).toHaveBeenCalled();
    });

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.updateProfile('', { displayName: 'Test' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyCreator', () => {
    it('should verify creator successfully', async () => {
      prismaService.$queryRawUnsafe
        .mockResolvedValueOnce(undefined) // executeRawUnsafe
        .mockResolvedValueOnce([mockProfile] as any); // getProfileByUserId

      const result = await service.verifyCreator('user-123', true);

      expect(result).toBeDefined();
      expect(prismaService.$executeRawUnsafe).toHaveBeenCalled();
    });

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.verifyCreator('', true)).rejects.toThrow(BadRequestException);
    });
  });
});
