/**
 * UsersService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { CurrentUser } from '@/common/types/user.types';

describe('UsersService', () => {
  let service: UsersService;
  const mockUserUpdate = jest.fn();
  const mockUserProfileUpsert = jest.fn();
  const mockTransaction = jest.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => {
    const tx = {
      user: { update: mockUserUpdate },
      userProfile: { upsert: mockUserProfileUpsert },
    };
    return cb(tx);
  });
  const mockPrisma: any = {
    user: { findUnique: jest.fn(), update: mockUserUpdate },
    userQuota: { findUnique: jest.fn(), update: jest.fn() },
    userProfile: { upsert: mockUserProfileUpsert },
    refreshToken: { findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  };
  mockPrisma.$transaction = mockTransaction;
  const mockCache = { get: jest.fn(), invalidate: jest.fn() };
  const mockCloudinary = { uploadImage: jest.fn() };
  const adminUser: CurrentUser = { id: 'user-1', email: 'admin@test.com', role: UserRole.PLATFORM_ADMIN };
  const regularUser: CurrentUser = { id: 'user-2', email: 'user@test.com', role: UserRole.CONSUMER };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
        { provide: CloudinaryService, useValue: mockCloudinary },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return user when found and current user is admin', async () => {
      const user = { id: 'user-2', email: 'user@test.com', firstName: 'John', lastName: 'Doe' };
      mockCache.get.mockImplementation((_k: string, _t: string, fn: () => Promise<unknown>) => fn());
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const result = await service.findOne('user-2', adminUser);
      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-2' } }));
    });

    it('should throw ForbiddenException when user requests another user profile', async () => {
      await expect(service.findOne('user-1', regularUser)).rejects.toThrow(ForbiddenException);
      await expect(service.findOne('user-1', regularUser)).rejects.toThrow('Access denied');
      expect(mockCache.get).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockCache.get.mockImplementation((_k: string, _t: string, fn: () => Promise<unknown>) => fn());
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing', adminUser)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing', adminUser)).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update profile and invalidate cache', async () => {
      const updated = {
        id: 'user-1',
        email: 'u@t.com',
        firstName: 'Jane',
        lastName: 'Doe',
        avatar: null,
        role: UserRole.CONSUMER,
        brandId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        brand: null,
        userQuota: null,
        userProfile: null,
      };
      mockUserUpdate.mockResolvedValue(undefined);
      mockUserProfileUpsert.mockResolvedValue(undefined);
      mockCache.invalidate.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue(updated);
      const result = await service.updateProfile('user-1', { firstName: 'Jane', lastName: 'Doe' });
      expect(result).toEqual(updated);
      expect(mockCache.invalidate).toHaveBeenCalledWith('user-1', 'user');
      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  describe('getUserQuota', () => {
    it('should return quota when found', async () => {
      const quota = { id: 'q1', userId: 'user-1', monthlyLimit: 100, monthlyUsed: 10 };
      mockCache.get.mockImplementation((_k: string, _t: string, fn: () => Promise<unknown>) => fn());
      mockPrisma.userQuota.findUnique.mockResolvedValue(quota);
      const result = await service.getUserQuota('user-1');
      expect(result).toEqual(quota);
    });

    it('should throw NotFoundException when quota not found', async () => {
      mockCache.get.mockImplementation((_k: string, _t: string, fn: () => Promise<unknown>) => fn());
      mockPrisma.userQuota.findUnique.mockResolvedValue(null);
      await expect(service.getUserQuota('user-1')).rejects.toThrow(NotFoundException);
      await expect(service.getUserQuota('user-1')).rejects.toThrow('User quota not found');
    });
  });

  describe('changePassword', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.changePassword('missing', 'oldPass', 'newPass')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', password: '$2a$13$hashed' });
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      await expect(service.changePassword('user-1', 'wrongPassword', 'newPass')).rejects.toThrow(BadRequestException);
      await expect(service.changePassword('user-1', 'wrongPassword', 'newPass')).rejects.toThrow('Current password is incorrect');
    });

    it('should update password when current password is valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', password: '$2a$13$hashed' });
      mockPrisma.user.update.mockResolvedValue({});
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2a$13$newHashed');
      const result = await service.changePassword('user-1', 'currentPass', 'newPass');
      expect(result).toEqual({ success: true, message: 'Password changed successfully' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { password: '$2a$13$newHashed' } });
    });
  });

  describe('getSessions', () => {
    it('should return active sessions for user', async () => {
      const tokens = [
        { id: 'token-1', createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000) },
        { id: 'token-2', createdAt: new Date(Date.now() - 3600000), expiresAt: new Date(Date.now() + 86400000) },
      ];
      mockPrisma.refreshToken.findMany.mockResolvedValue(tokens);

      const result = await service.getSessions('user-1');

      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].id).toBe('token-1');
      expect(result.sessions[0].current).toBe(true);
      expect(result.sessions[1].current).toBe(false);
      expect(mockPrisma.refreshToken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', expiresAt: { gt: expect.any(Date) } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      );
    });

    it('should return empty sessions when user has none', async () => {
      mockPrisma.refreshToken.findMany.mockResolvedValue([]);

      const result = await service.getSessions('user-1');

      expect(result.sessions).toEqual([]);
    });
  });

  describe('deleteSession', () => {
    it('should delete session when token belongs to user', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({ id: 'token-1', userId: 'user-1' });
      mockPrisma.refreshToken.delete.mockResolvedValue({} as never);
      const result = await service.deleteSession('user-1', 'token-1');
      expect(result).toEqual({ success: true, message: 'Session deleted successfully' });
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'token-1' } });
    });

    it('should throw NotFoundException when token not found', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.deleteSession('user-1', 'token-1')).rejects.toThrow(NotFoundException);
      await expect(service.deleteSession('user-1', 'token-1')).rejects.toThrow('Session not found');
    });
  });

  describe('uploadAvatar', () => {
    it('should throw BadRequestException when no file provided', async () => {
      await expect(service.uploadAvatar('user-1', null as any)).rejects.toThrow(BadRequestException);
      await expect(service.uploadAvatar('user-1', null as any)).rejects.toThrow('No file provided');
    });

    it('should throw BadRequestException when file is not an image', async () => {
      await expect(service.uploadAvatar('user-1', { buffer: Buffer.from(''), mimetype: 'application/pdf', size: 100 })).rejects.toThrow(BadRequestException);
      await expect(service.uploadAvatar('user-1', { buffer: Buffer.from(''), mimetype: 'application/pdf', size: 100 })).rejects.toThrow('File must be an image');
    });

    it('should throw BadRequestException when image exceeds 2MB', async () => {
      await expect(service.uploadAvatar('user-1', { buffer: Buffer.alloc(3 * 1024 * 1024), mimetype: 'image/png', size: 3 * 1024 * 1024 })).rejects.toThrow(BadRequestException);
      await expect(service.uploadAvatar('user-1', { buffer: Buffer.alloc(3 * 1024 * 1024), mimetype: 'image/png', size: 3 * 1024 * 1024 })).rejects.toThrow('Image size must not exceed 2MB');
    });

    it('should upload avatar and update user', async () => {
      const avatarUrl = 'https://cloudinary.com/avatar.jpg';
      mockCloudinary.uploadImage.mockResolvedValue(avatarUrl);
      mockPrisma.user.update.mockResolvedValue({ avatar: avatarUrl });
      const result = await service.uploadAvatar('user-1', { buffer: Buffer.from('png'), mimetype: 'image/png', size: 1024 });
      expect(result).toEqual({ avatar: avatarUrl });
      expect(mockCloudinary.uploadImage).toHaveBeenCalledWith(expect.any(Buffer), 'avatars');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { avatar: avatarUrl } });
    });
  });
});
