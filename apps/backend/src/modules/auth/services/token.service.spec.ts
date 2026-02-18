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
import { UserRole } from '@prisma/client';

describe('TokenService', () => {
  let service: TokenService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const userId = 'user-123';
  const email = 'test@example.com';
  const role = UserRole.CONSUMER;

  const mockUser = {
    id: userId,
    email,
    firstName: 'Test',
    lastName: 'User',
    role,
    isActive: true,
    brandId: 'brand-123',
    brand: {
      id: 'brand-123',
      name: 'Test Brand',
    },
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
        { sub: userId, email, role },
        {
          secret: 'test-secret',
          expiresIn: '15m',
        },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: userId, email, role },
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
        { sub: userId, email, role },
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
          token,
          expiresAt: expect.any(Date),
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
          token,
          expiresAt: expect.any(Date),
          family,
        },
      });
    });

    it('should not include family when not provided', async () => {
      // Arrange
      const token = 'refresh-token-123';
      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue({});

      // Act
      await service.saveRefreshToken(userId, token);

      // Assert
      const callArgs = (prismaService.refreshToken.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.data).not.toHaveProperty('family');
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
        usedAt: null,
        revokedAt: null,
        family: 'family-123',
        user: mockUser,
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
        brandId: mockUser.brandId,
        brand: mockUser.brand,
      });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-refresh-secret',
      });
      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-refresh-token' },
        include: {
          user: {
            include: {
              brand: true,
            },
          },
        },
      });
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-123' },
        data: { usedAt: expect.any(Date) },
      });
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: 'new-refresh-token',
          expiresAt: expect.any(Date),
          family: 'family-123',
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
        usedAt: null,
        revokedAt: null,
        family: 'family-123',
        user: mockUser,
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
        usedAt: new Date(), // Already used - indicates reuse
        revokedAt: null,
        family: 'family-123',
        user: mockUser,
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
        where: { family: 'family-123' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should detect revoked token and throw UnauthorizedException', async () => {
      // Arrange
      const revokedTokenRecord = {
        id: 'token-123',
        token: 'valid-refresh-token',
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        usedAt: null,
        revokedAt: new Date(), // Revoked
        family: 'family-123',
        user: mockUser,
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
            {
              usedAt: {
                lt: expect.any(Date),
              },
            },
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

    it('should delete tokens used more than 24 hours ago', async () => {
      // Arrange
      (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      // Act
      await service.cleanupExpiredTokens();

      // Assert
      const callArgs = (prismaService.refreshToken.deleteMany as jest.Mock).mock.calls[0][0];
      const usedAtCondition = callArgs.where.OR[2];
      expect(usedAtCondition.usedAt.lt).toBeInstanceOf(Date);
      const expectedDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const diff = Math.abs(usedAtCondition.usedAt.lt.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000); // Within 1 second
    });
  });
});
