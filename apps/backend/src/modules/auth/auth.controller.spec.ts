/**
 * AuthController - Tests unitaires
 * TEST-06: Tests Controllers critiques
 * Tests pour les endpoints d'authentification
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;

  // Mock response object
  // json() returns the data passed to it (to match new controller behavior)
  const mockResponse = () => {
    const res: Partial<Response> = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => data),
      send: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  // Mock request object
  const mockRequest = (userId?: string, ip?: string) => ({
    user: userId ? { id: userId, email: 'test@example.com' } : undefined,
    ip: ip || '127.0.0.1',
    headers: { 'x-forwarded-for': ip || '127.0.0.1' },
    cookies: {},
  });

  beforeEach(async () => {
    const mockAuthService = {
      signup: jest.fn(),
      login: jest.fn(),
      loginWith2FA: jest.fn(),
      setup2FA: jest.fn(),
      verifyAndEnable2FA: jest.fn(),
      disable2FA: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      verifyEmail: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'app.nodeEnv': 'test',
          'app.isProduction': false,
          'jwt.expiresIn': '15m',
          'jwt.refreshExpiresIn': '7d',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully create a new user', async () => {
      const mockResult = {
        user: {
          id: 'user_123',
          email: signupDto.email,
          firstName: signupDto.firstName,
          lastName: signupDto.lastName,
          role: 'USER',
          emailVerified: false,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      authService.signup.mockResolvedValue(mockResult as any);

      const res = mockResponse();
      const result = await controller.signup(signupDto, res) as any;

      expect(authService.signup).toHaveBeenCalledWith(signupDto);
      expect(res.cookie).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(signupDto.email);
    });

    it('should throw ConflictException when user already exists', async () => {
      authService.signup.mockRejectedValue(
        new ConflictException('User already exists')
      );

      const res = mockResponse();
      await expect(controller.signup(signupDto, res)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw BadRequestException for invalid email', async () => {
      authService.signup.mockRejectedValue(
        new BadRequestException('Invalid email format')
      );

      const res = mockResponse();
      await expect(
        controller.signup({ ...signupDto, email: 'invalid' }, res)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /auth/login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
    };

    it('should successfully login a user', async () => {
      const mockResult = {
        user: {
          id: 'user_123',
          email: loginDto.email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      authService.login.mockResolvedValue(mockResult as any);

      const req = mockRequest();
      const res = mockResponse();
      const result = await controller.login(loginDto, req, res) as any;

      expect(authService.login).toHaveBeenCalledWith(loginDto, '127.0.0.1');
      expect(res.cookie).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
    });

    it('should return requires2FA when 2FA is enabled', async () => {
      const mockResult = {
        requires2FA: true,
        tempToken: 'temp-token-123',
        user: {
          id: 'user_123',
          email: loginDto.email,
        },
      };

      authService.login.mockResolvedValue(mockResult as any);

      const req = mockRequest();
      const res = mockResponse();
      const result = await controller.login(loginDto, req, res) as any;

      expect(result).toHaveProperty('requires2FA', true);
      expect(result).toHaveProperty('tempToken');
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      const req = mockRequest();
      const res = mockResponse();
      await expect(controller.login(loginDto, req, res)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('POST /auth/login/2fa', () => {
    const login2FADto = {
      tempToken: 'temp-token-123',
      token: '123456',
    };

    it('should successfully login with 2FA', async () => {
      const mockResult = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      authService.loginWith2FA.mockResolvedValue(mockResult as any);

      const req = mockRequest();
      const res = mockResponse();
      const result = await controller.loginWith2FA(login2FADto, req, res) as any;

      expect(authService.loginWith2FA).toHaveBeenCalledWith(login2FADto, '127.0.0.1');
      expect(res.cookie).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException for invalid 2FA code', async () => {
      authService.loginWith2FA.mockRejectedValue(
        new UnauthorizedException('Invalid 2FA code')
      );

      const req = mockRequest();
      const res = mockResponse();
      await expect(controller.loginWith2FA(login2FADto, req, res)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('POST /auth/2fa/setup', () => {
    it('should setup 2FA for authenticated user', async () => {
      const mockResult = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCodeUrl: 'data:image/png;base64,...',
        backupCodes: ['code1', 'code2', 'code3', 'code4', 'code5'],
      };

      authService.setup2FA.mockResolvedValue(mockResult);

      const req = mockRequest('user_123');
      const result = await controller.setup2FA(req);

      expect(authService.setup2FA).toHaveBeenCalledWith('user_123');
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('backupCodes');
    });
  });

  describe('POST /auth/2fa/verify', () => {
    const verify2FADto = { token: '123456' };

    it('should verify and enable 2FA', async () => {
      const mockResult = {
        success: true,
        backupCodes: ['CODE1', 'CODE2', 'CODE3'],
      };

      authService.verifyAndEnable2FA.mockResolvedValue(mockResult as any);

      const req = mockRequest('user_123');
      const result = await controller.verify2FA(req, verify2FADto);

      expect(authService.verifyAndEnable2FA).toHaveBeenCalledWith('user_123', verify2FADto);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('backupCodes');
    });

    it('should throw BadRequestException for invalid code', async () => {
      authService.verifyAndEnable2FA.mockRejectedValue(
        new BadRequestException('Invalid verification code')
      );

      const req = mockRequest('user_123');
      await expect(controller.verify2FA(req, verify2FADto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('POST /auth/2fa/disable', () => {
    it('should disable 2FA for authenticated user', async () => {
      authService.disable2FA.mockResolvedValue({ message: '2FA disabled successfully' });

      const req = mockRequest('user_123');
      const result = await controller.disable2FA(req);

      expect(authService.disable2FA).toHaveBeenCalledWith('user_123');
      expect(result).toHaveProperty('message');
    });
  });

  describe('POST /auth/refresh', () => {
    const refreshTokenDto = { refreshToken: 'valid-refresh-token' };

    it('should refresh tokens successfully', async () => {
      const mockResult = {
        user: { id: 'user_123', email: 'test@example.com' },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      authService.refreshToken.mockResolvedValue(mockResult as any);

      const req = mockRequest();
      req.cookies = { refreshToken: 'valid-refresh-token' };
      const res = mockResponse();
      const result = await controller.refreshToken(refreshTokenDto, req, res);

      expect(authService.refreshToken).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      const req = mockRequest();
      req.cookies = { refreshToken: 'valid-refresh-token' };
      const res = mockResponse();
      await expect(controller.refreshToken(refreshTokenDto, req, res)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user and clear cookies', async () => {
      authService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      const req = mockRequest('user_123');
      const res = mockResponse();
      const result = await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });

  describe('POST /auth/forgot-password', () => {
    const forgotPasswordDto = { email: 'test@example.com' };

    it('should send password reset email', async () => {
      authService.forgotPassword.mockResolvedValue({ message: 'Password reset link sent' });

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
      expect(result).toHaveProperty('message');
    });

    it('should not reveal if email exists (security)', async () => {
      // Should always return success even if email doesn't exist
      authService.forgotPassword.mockResolvedValue({ message: 'Password reset link sent' });

      const result = await controller.forgotPassword({
        email: 'nonexistent@example.com',
      });

      expect(result).toHaveProperty('message');
    });
  });

  describe('POST /auth/reset-password', () => {
    const resetPasswordDto = {
      token: 'valid-reset-token',
      password: 'NewSecurePassword123!',
    };

    it('should reset password successfully', async () => {
      authService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' });

      const result = await controller.resetPassword(resetPasswordDto);

      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
      expect(result).toHaveProperty('message');
    });

    it('should throw BadRequestException for invalid token', async () => {
      authService.resetPassword.mockRejectedValue(
        new BadRequestException('Invalid or expired reset token')
      );

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('POST /auth/verify-email', () => {
    const verifyEmailDto = { token: 'valid-verification-token' };

    it('should verify email successfully', async () => {
      authService.verifyEmail.mockResolvedValue({ message: 'Email verified', verified: true });

      const result = await controller.verifyEmail(verifyEmailDto);

      expect(authService.verifyEmail).toHaveBeenCalledWith(verifyEmailDto);
      expect(result).toHaveProperty('verified', true);
    });

    it('should throw BadRequestException for invalid token', async () => {
      authService.verifyEmail.mockRejectedValue(
        new BadRequestException('Invalid verification token')
      );

      await expect(controller.verifyEmail(verifyEmailDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        emailVerified: true,
        twoFactorEnabled: false,
      };

      // Le contrôleur retourne directement req.user
      const req = { user: mockUser, ip: '127.0.0.1', headers: {}, cookies: {} };
      const result = await controller.getProfile(req);

      expect(result).toEqual(mockUser);
    });

    it('should return undefined if not authenticated', async () => {
      // Si pas d'utilisateur dans la requête
      const req = { user: undefined, ip: '127.0.0.1', headers: {}, cookies: {} };
      const result = await controller.getProfile(req);

      expect(result).toBeUndefined();
    });
  });
});
