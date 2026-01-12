/**
 * OAuth Service Unit Tests
 * Comprehensive tests for OAuth user management
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { OAuthService, OAuthUser } from './oauth.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('OAuthService', () => {
  let service: OAuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockOAuthUser: OAuthUser = {
    provider: 'google',
    providerId: 'google-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    picture: 'https://example.com/avatar.jpg',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg',
    role: UserRole.CONSUMER,
    emailVerified: true,
    brand: null,
  };

  const mockOAuthAccount = {
    id: 'oauth-1',
    userId: 'user-1',
    provider: 'google' as const,
    providerId: 'google-123',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      oAuthAccount: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      userQuota: {
        create: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateOAuthUser', () => {
    it('should find existing user and link OAuth account', async () => {
      // Arrange
      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prisma.oAuthAccount.findFirst = jest.fn().mockResolvedValue(null);
      prisma.oAuthAccount.create = jest.fn().mockResolvedValue(mockOAuthAccount);

      // Act
      const result = await service.findOrCreateOAuthUser(mockOAuthUser);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockOAuthUser.email },
        include: { brand: true },
      });
      expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          provider: mockOAuthUser.provider,
          providerId: mockOAuthUser.providerId,
          accessToken: mockOAuthUser.accessToken,
          refreshToken: mockOAuthUser.refreshToken,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should find existing user with existing OAuth account and update tokens', async () => {
      // Arrange
      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prisma.oAuthAccount.findFirst = jest.fn().mockResolvedValue(mockOAuthAccount);
      prisma.oAuthAccount.update = jest.fn().mockResolvedValue({
        ...mockOAuthAccount,
        accessToken: 'new-access-token',
      });

      // Act
      const result = await service.findOrCreateOAuthUser({
        ...mockOAuthUser,
        accessToken: 'new-access-token',
      });

      // Assert
      expect(prisma.oAuthAccount.update).toHaveBeenCalledWith({
        where: { id: mockOAuthAccount.id },
        data: {
          accessToken: 'new-access-token',
          refreshToken: mockOAuthUser.refreshToken,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should create new user with OAuth account', async () => {
      // Arrange
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);
      prisma.user.create = jest.fn().mockResolvedValue(mockUser);
      prisma.userQuota.create = jest.fn().mockResolvedValue({ id: 'quota-1', userId: 'user-1' });

      // Act
      const result = await service.findOrCreateOAuthUser(mockOAuthUser);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: mockOAuthUser.email,
          firstName: mockOAuthUser.firstName || '',
          lastName: mockOAuthUser.lastName || '',
          avatar: mockOAuthUser.picture || undefined,
          emailVerified: true,
          role: UserRole.CONSUMER,
          oauthAccounts: {
            create: {
              provider: mockOAuthUser.provider,
              providerId: mockOAuthUser.providerId,
              accessToken: mockOAuthUser.accessToken,
              refreshToken: mockOAuthUser.refreshToken,
            },
          },
        },
        include: { brand: true },
      });
      expect(prisma.userQuota.create).toHaveBeenCalledWith({
        data: { userId: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException on error', async () => {
      // Arrange
      prisma.user.findUnique = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findOrCreateOAuthUser(mockOAuthUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('unlinkOAuthAccount', () => {
    it('should successfully unlink OAuth account', async () => {
      // Arrange
      prisma.oAuthAccount.deleteMany = jest.fn().mockResolvedValue({ count: 1 });

      // Act
      const result = await service.unlinkOAuthAccount('user-1', 'google');

      // Assert
      expect(prisma.oAuthAccount.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          provider: 'google',
        },
      });
      expect(result).toEqual({ success: true, deleted: 1 });
    });

    it('should handle account not found gracefully', async () => {
      // Arrange
      prisma.oAuthAccount.deleteMany = jest.fn().mockResolvedValue({ count: 0 });

      // Act
      const result = await service.unlinkOAuthAccount('user-1', 'google');

      // Assert
      expect(result).toEqual({ success: true, deleted: 0 });
    });

    it('should throw error on database failure', async () => {
      // Arrange
      prisma.oAuthAccount.deleteMany = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.unlinkOAuthAccount('user-1', 'google')).rejects.toThrow();
    });
  });

  describe('getLinkedAccounts', () => {
    it('should return linked OAuth accounts', async () => {
      // Arrange
      const accounts = [mockOAuthAccount];
      prisma.oAuthAccount.findMany = jest.fn().mockResolvedValue(accounts);

      // Act
      const result = await service.getLinkedAccounts('user-1');

      // Assert
      expect(prisma.oAuthAccount.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: {
          id: true,
          provider: true,
          providerId: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(accounts);
    });

    it('should return empty array when no accounts found', async () => {
      // Arrange
      prisma.oAuthAccount.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.getLinkedAccounts('user-1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getOAuthConfig', () => {
    it('should return Google OAuth config when configured', () => {
      // Arrange
      configService.get = jest
        .fn()
        .mockImplementation((key: string) => {
          if (key === 'oauth.google.clientId' || key === 'GOOGLE_CLIENT_ID') return 'client-id';
          if (key === 'oauth.google.clientSecret' || key === 'GOOGLE_CLIENT_SECRET')
            return 'client-secret';
          if (key === 'oauth.google.callbackUrl' || key === 'GOOGLE_CALLBACK_URL')
            return 'callback-url';
          return undefined;
        });

      // Act
      const config = service.getOAuthConfig();

      // Assert
      expect(config.google).toBeDefined();
      expect(config.google?.clientId).toBe('client-id');
      expect(config.google?.clientSecret).toBe('client-secret');
    });

    it('should return undefined for Google when not configured', () => {
      // Arrange
      configService.get = jest.fn().mockReturnValue(undefined);

      // Act
      const config = service.getOAuthConfig();

      // Assert
      expect(config.google).toBeUndefined();
    });
  });

  describe('isGoogleConfigured', () => {
    it('should return true when Google OAuth is configured', () => {
      // Arrange
      configService.get = jest.fn().mockReturnValue('client-id');

      // Act
      const result = service.isGoogleConfigured();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when Google OAuth is not configured', () => {
      // Arrange
      configService.get = jest.fn().mockReturnValue(undefined);

      // Act
      const result = service.isGoogleConfigured();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isGitHubConfigured', () => {
    it('should return true when GitHub OAuth is configured', () => {
      // Arrange
      configService.get = jest.fn().mockReturnValue('client-id');

      // Act
      const result = service.isGitHubConfigured();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when GitHub OAuth is not configured', () => {
      // Arrange
      configService.get = jest.fn().mockReturnValue(undefined);

      // Act
      const result = service.isGitHubConfigured();

      // Assert
      expect(result).toBe(false);
    });
  });
});
