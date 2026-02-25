/**
 * TokenService - Unit tests
 * Tests for token generation, refresh token rotation, logout, and cleanup
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TokenBlacklistService } from '@/libs/auth/token-blacklist.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { PlatformRole } from '@prisma/client';

describe('TokenService', () => {
  let service: TokenService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const userId = 'user-123';
  const email = 'test@example.com';
  const role = PlatformRole.USER;

  const mockUser = {
    id: userId,
    email,
    firstName: 'Test',
    lastName: 'User',
    role,
    deletedAt: null,
    memberships: [
      {
        organizationId: 'org-123',
        organization: {
          id: 'org-123',
          name: 'Test Organization',
          slug: 'test-organization',
          plan: 'FREE',
        },
      },
    ],
  };

  beforeEach(async () => {
    const mockPrisma = {
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          'jwt.secret': 'test-secret',
          'jwt.refreshSecret': 'test-refresh-secret',
          'jwt.expiresIn': '15m',
          'jwt.refreshExpiresIn': '7d',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
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
        {
          provide: TokenBlacklistService,
          useValue: { blacklistUser: jest.fn().mockResolvedValue(undefined), isBlacklisted: jest.fn().mockResolvedValue(false) },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      // Arrange
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token-123')
        .mockResolvedValueOnce('refresh-token-456');

      // Act
      const result = await service.generateTokens(userId, email, role);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        { sub: userId, email, role, jti: expect.any(String) },
        {
          secret: 'test-secret',
          expiresIn: '15m',
        },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: userId, email, role, jti: expect.any(String) },
        {
          secret: 'test-refresh-secret',
          expiresIn: '7d',
        },
      );
      expect(configService.get).toHaveBeenCalledWith('jwt.secret');
      expect(configService.get).toHaveBeenCalledWith('jwt.expiresIn');
      expect(configService.get).toHaveBeenCalledWith('jwt.refreshSecret');
      expect(configService.get).toHaveBeenCalledWith('jwt.refreshExpiresIn');
    });

    it('should use correct payload structure', async () => {
      // Arrange
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      await service.generateTokens(userId, email, role);

      // Assert
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: userId, email, role, jti: expect.any(String) },
        expect.any(Object),
      );
    });
  });

  describe('saveRefreshToken', () => {
    it('should save refresh token to database', async () => {
      // Arrange
      const token = 'refresh-token-123';
      const mockCreatedToken = {
        id: 'token-id',
        userId,
        token,
        expiresAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue(mockCreatedToken);

      // Act
      await service.saveRefreshToken(userId, token);

      // Assert
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: expect.any(String),
          expiresAt: expect.any(Date),
          deviceId: expect.any(String),
        },
      });
      const callArgs = (prismaService.refreshToken.create as jest.Mock).mock.calls[0][0];
      const expiresAt = callArgs.data.expiresAt;
      expect(expiresAt).toBeInstanceOf(Date);
      // Should be approximately 7 days from now
      const expectedExpiry = new Date();
      expectedExpiry.setDate(expectedExpiry.getDate() + 7);
      const diff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime());
      expect(diff).toBeLessThan(1000); // Within 1 second
    });

    it('should save refresh token with family when provided', async () => {
      // Arrange
      const token = 'refresh-token-123';
      const family = 'family-123';
      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue({});

      // Act
      await service.saveRefreshToken(userId, token, family);

      // Assert
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: expect.any(String),
          expiresAt: expect.any(Date),
          deviceId: family,
        },
      });
    });

    it('should generate a family id when not provided', async () => {
      // Arrange
      const token = 'refresh-token-123';
      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue({});

      // Act
      await service.saveRefreshToken(userId, token);

      // Assert
      const callArgs = (prismaService.refreshToken.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.data).toHaveProperty('deviceId');
      expect(typeof callArgs.data.deviceId).toBe('string');
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh tokens with valid refresh token (rotation)', async () => {
      // Arrange
      const tokenRecord = {
        id: 'token-123',
        token: 'valid-refresh-token',
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isRevoked: false,
        revokedAt: null,
        deviceId: 'family-123',
        deviceName: 'test-agent',
      };

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userId,
        email,
        role,
      });
      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(tokenRecord);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      (prismaService.refreshToken.update as jest.Mock).mockResolvedValue({});
      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue({});
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.refreshToken(refreshTokenDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.user).toEqual({
        id: userId,
        email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role,
        organizationId: 'org-123',
        organization: mockUser.memberships[0].organization,
      });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-refresh-secret',
      });
      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: expect.any(String) },
      });
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-123' },
        data: { isRevoked: true, revokedAt: expect.any(Date) },
      });
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: expect.any(String),
          expiresAt: expect.any(Date),
          deviceId: 'family-123',
        },
      });
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      // Arrange
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      expect(prismaService.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token record not found', async () => {
      // Arrange
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userId,
        email,
        role,
      });
      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      // Arrange
      const expiredTokenRecord = {
        id: 'token-123',
        token: 'expired-refresh-token',
        userId,
        expiresAt: new Date(Date.now() - 1000), // Expired
        isRevoked: false,
        revokedAt: null,
        deviceId: 'family-123',
      };

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userId,
        email,
        role,
      });
      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(expiredTokenRecord);

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow('Refresh token expired');
    });

    it('should detect token reuse and revoke entire family', async () => {
      // Arrange
      const reusedTokenRecord = {
        id: 'token-123',
        token: 'valid-refresh-token',
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: true,
        revokedAt: new Date(),
        deviceId: 'family-123',
      };

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userId,
        email,
        role,
      });
      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(reusedTokenRecord);
      (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'Refresh token has been revoked. Please login again.',
      );
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId, deviceId: 'family-123' },
        data: { isRevoked: true, revokedAt: expect.any(Date) },
      });
    });

    it('should detect revoked token and throw UnauthorizedException', async () => {
      // Arrange
      const revokedTokenRecord = {
        id: 'token-123',
        token: 'valid-refresh-token',
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        revokedAt: new Date(), // Revoked
        deviceId: 'family-123',
      };

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userId,
        email,
        role,
      });
      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(revokedTokenRecord);
      (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('should handle generic errors and throw UnauthorizedException', async () => {
      // Arrange
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for user', async () => {
      // Arrange
      (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      // Act
      const result = await service.logout(userId);

      // Assert
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return success message even if no tokens exist', async () => {
      // Arrange
      (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      // Act
      const result = await service.logout(userId);

      // Assert
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      // Arrange
      (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      // Act
      const result = await service.cleanupExpiredTokens();

      // Assert
      expect(result).toBe(5);
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { revokedAt: { not: null } },
            { isRevoked: true },
          ],
        },
      });
    });

    it('should return 0 when no tokens to cleanup', async () => {
      // Arrange
      (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      // Act
      const result = await service.cleanupExpiredTokens();

      // Assert
      expect(result).toBe(0);
    });

    it('should include revoked tokens in cleanup criteria', async () => {
      // Arrange
      (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      // Act
      await service.cleanupExpiredTokens();

      // Assert
      const callArgs = (prismaService.refreshToken.deleteMany as jest.Mock).mock.calls[0][0];
      const revokedCondition = callArgs.where.OR[2];
      expect(revokedCondition).toEqual({ isRevoked: true });
    });
  });
});
