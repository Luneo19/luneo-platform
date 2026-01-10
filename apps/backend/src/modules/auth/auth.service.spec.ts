/**
 * AuthService - Tests unitaires
 * Tests pour l'authentification, signup, login, refresh token
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { createTestingModule, testFixtures, testHelpers } from '@/common/test/test-setup';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await createTestingModule([
      AuthService,
    ]);

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Setup default mocks
    mockedBcrypt.hash.mockResolvedValue('hashed_password' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    jwtService.sign.mockReturnValue('mock_token');
    (jwtService.signAsync as jest.Mock) = jest.fn().mockResolvedValue('mock_token');
    configService.get.mockImplementation((key: string) => {
      const defaults: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.refreshSecret': 'test-refresh-secret',
        'jwt.expiresIn': '15m',
        'jwt.refreshExpiresIn': '7d',
      };
      return defaults[key] || '15m';
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should create a new user successfully', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(null);
      (prismaService.user.create as any).mockResolvedValue({
        ...testFixtures.user,
        email: signupDto.email,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        password: 'hashed_password',
        brand: testFixtures.brand,
      } as any);
      (prismaService.userQuota.create as any).mockResolvedValue({} as any);

      // Act
      const result = await service.signup(signupDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user.email).toBe(signupDto.email);
      expect(result.user.firstName).toBe(signupDto.firstName);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(signupDto.password, 12);
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(prismaService.userQuota.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(testFixtures.user as any);

      // Act & Assert
      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(null);
      (prismaService.user.create as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
      } as any);
      (prismaService.userQuota.create as any).mockResolvedValue({} as any);

      // Act
      await service.signup(signupDto);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(signupDto.password, 12);
      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
          }),
        }),
      );
    });

    it('should generate tokens after signup', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(null);
      (prismaService.user.create as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
      } as any);
      (prismaService.userQuota.create as any).mockResolvedValue({} as any);
      jwtService.sign.mockReturnValue('access_token');

      // Act
      const result = await service.signup(signupDto);

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(jwtService.signAsync).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user with valid credentials', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
      } as any);
      (prismaService.user.update as any).mockResolvedValue(testFixtures.user as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user.email).toBe(loginDto.email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hashed_password');
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testFixtures.user.id },
          data: { lastLoginAt: expect.any(Date) },
        }),
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
      } as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockedBcrypt.compare).toHaveBeenCalled();
    });

    it('should update lastLoginAt on successful login', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
      } as any);
      (prismaService.user.update as any).mockResolvedValue(testFixtures.user as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      await service.login(loginDto);

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testFixtures.user.id },
          data: { lastLoginAt: expect.any(Date) },
        }),
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refreshToken: 'valid_refresh_token',
    };

    it('should refresh tokens with valid refresh token', async () => {
      // Arrange
      const mockTokenRecord = {
        id: 'token_123',
        token: 'valid_refresh_token',
        userId: testFixtures.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        user: {
          ...testFixtures.user,
          brand: testFixtures.brand,
        },
      };

      jwtService.verifyAsync = jest.fn().mockResolvedValue({ 
        sub: testFixtures.user.id, 
        email: testFixtures.user.email 
      });
      (prismaService.refreshToken.findUnique as any).mockResolvedValue(mockTokenRecord as any);
      jwtService.signAsync = jest.fn().mockResolvedValue('new_access_token');
      (prismaService.refreshToken.delete as any).mockResolvedValue({} as any);
      (prismaService.refreshToken.create as any).mockResolvedValue({} as any);

      // Act
      const result = await service.refreshToken(refreshTokenDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(jwtService.verifyAsync).toHaveBeenCalled();
      expect(prismaService.refreshToken.delete).toHaveBeenCalled();
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token record not found', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({ 
        sub: testFixtures.user.id 
      });
      (prismaService.refreshToken.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      // Arrange
      const expiredTokenRecord = {
        id: 'token_123',
        token: 'expired_refresh_token',
        userId: testFixtures.user.id,
        expiresAt: new Date(Date.now() - 1000), // Expired
        user: testFixtures.user,
      };

      jwtService.verifyAsync = jest.fn().mockResolvedValue({ 
        sub: testFixtures.user.id 
      });
      (prismaService.refreshToken.findUnique as any).mockResolvedValue(expiredTokenRecord as any);

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailDto = {
      token: 'valid_verification_token',
    };

    it('should verify email with valid token', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'email_verification',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        emailVerified: false,
      } as any);
      (prismaService.user.update as any).mockResolvedValue({
        ...testFixtures.user,
        emailVerified: true,
      } as any);

      // Act
      const result = await service.verifyEmail(verifyEmailDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testFixtures.user.id },
          data: { emailVerified: true },
        }),
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'email_verification',
      });
      (prismaService.user.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid_reset_token',
      password: 'NewPassword123!',
    };

    it('should reset password with valid token', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'password_reset',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'old_hashed_password',
      } as any);
      mockedBcrypt.compare.mockResolvedValue(false as never); // New password different
      mockedBcrypt.hash.mockResolvedValue('new_hashed_password' as never);
      (prismaService.user.update as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'new_hashed_password',
      } as any);

      // Act
      const result = await service.resetPassword(resetPasswordDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Password reset successfully');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(resetPasswordDto.password, 12);
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if new password same as old', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'password_reset',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'old_hashed_password',
      } as any);
      mockedBcrypt.compare.mockResolvedValue(true as never); // Same password

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });
  });
});

