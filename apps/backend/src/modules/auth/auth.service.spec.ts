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
import { EmailService } from '../email/email.service';
import { BruteForceService } from './services/brute-force.service';
import { TwoFactorService } from './services/two-factor.service';
import { CaptchaService } from './services/captcha.service';
import { TokenService } from './services/token.service';
import { OAuthService } from './services/oauth.service';
import { ReferralService } from '../referral/referral.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';
import { testFixtures } from '@/common/test/test-setup';
import { UserRole } from '@prisma/client';
import * as passwordHasher from '@/libs/crypto/password-hasher';

// Mock password-hasher (Argon2id + bcrypt migration)
jest.mock('@/libs/crypto/password-hasher', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  verifyPassword: jest.fn().mockResolvedValue({ isValid: true, needsRehash: false }),
}));
const mockedHashPassword = passwordHasher.hashPassword as jest.MockedFunction<typeof passwordHasher.hashPassword>;
const mockedVerifyPassword = passwordHasher.verifyPassword as jest.MockedFunction<typeof passwordHasher.verifyPassword>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let emailService: jest.Mocked<EmailService>;
  let bruteForceService: jest.Mocked<BruteForceService>;
  let twoFactorService: jest.Mocked<TwoFactorService>;
  let captchaService: jest.Mocked<CaptchaService>;
  let tokenService: jest.Mocked<TokenService>;
  let oauthService: jest.Mocked<OAuthService>;

  beforeEach(async () => {
    const mockEmailService = {
      sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      queueConfirmationEmail: jest.fn().mockResolvedValue({ jobId: 'job_1' }),
      queuePasswordResetEmail: jest.fn().mockResolvedValue({ jobId: 'job_1' }),
      queueWelcomeEmail: jest.fn().mockResolvedValue({ jobId: 'job_1' }),
    };

    const mockBruteForceService = {
      checkAndThrow: jest.fn().mockResolvedValue(undefined),
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      resetAttempts: jest.fn().mockResolvedValue(undefined),
    };

    const mockTwoFactorService = {
      generateSecret: jest.fn().mockReturnValue({ secret: 'test-secret', otpauthUrl: 'test-url' }),
      verifyToken: jest.fn().mockReturnValue(true),
      generateQRCode: jest.fn().mockResolvedValue('data:image/png;base64,test'),
      generateBackupCodes: jest.fn().mockResolvedValue({ 
        plaintextCodes: ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5', 'CODE6', 'CODE7', 'CODE8', 'CODE9', 'CODE10'], 
        hashedCodes: ['hash1', 'hash2', 'hash3', 'hash4', 'hash5', 'hash6', 'hash7', 'hash8', 'hash9', 'hash10'] 
      }),
      validateBackupCode: jest.fn().mockResolvedValue({ isValid: false, matchedIndex: -1 }),
    };

    const mockCaptchaService = {
      verifyToken: jest.fn().mockResolvedValue(true),
      isEnabled: jest.fn().mockReturnValue(true),
    };

    const mockTokenService = {
      generateTokens: jest.fn().mockResolvedValue({ accessToken: 'access_token', refreshToken: 'refresh_token' }),
      saveRefreshToken: jest.fn().mockResolvedValue(undefined),
      refreshToken: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
    };

    const mockOAuthService = {
      revokeProviderTokens: jest.fn().mockResolvedValue(undefined),
    };

    const mockReferralService = {
      recordReferral: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            userQuota: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const defaults: Record<string, string> = {
                'jwt.secret': 'test-secret',
                'jwt.refreshSecret': 'test-refresh-secret',
                'jwt.expiresIn': '15m',
                'jwt.refreshExpiresIn': '7d',
                'app.frontendUrl': 'https://app.luneo.app',
                'app.nodeEnv': 'test',
              };
              return defaults[key];
            }),
          },
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn().mockReturnValue('encrypted-value'),
            decrypt: jest.fn().mockReturnValue('decrypted-value'),
          },
        },
        {
          provide: BruteForceService,
          useValue: mockBruteForceService,
        },
        {
          provide: TwoFactorService,
          useValue: mockTwoFactorService,
        },
        {
          provide: CaptchaService,
          useValue: mockCaptchaService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: OAuthService,
          useValue: mockOAuthService,
        },
        {
          provide: ReferralService,
          useValue: mockReferralService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    emailService = module.get(EmailService);
    bruteForceService = module.get(BruteForceService);
    twoFactorService = module.get(TwoFactorService);
    captchaService = module.get(CaptchaService);
    tokenService = module.get(TokenService);
    oauthService = module.get(OAuthService);

    // Re-apply token service defaults (cleared by clearAllMocks in afterEach)
    tokenService.generateTokens.mockResolvedValue({ accessToken: 'access_token', refreshToken: 'refresh_token' });
    tokenService.saveRefreshToken.mockResolvedValue(undefined);
    tokenService.logout.mockResolvedValue(undefined as any);
    oauthService.revokeProviderTokens.mockResolvedValue(undefined);

    // Setup default mocks
    mockedHashPassword.mockResolvedValue('hashed_password');
    mockedVerifyPassword.mockResolvedValue({ isValid: true, needsRehash: false });
    jwtService.sign.mockReturnValue('mock_token');
    (jwtService.signAsync as jest.Mock).mockResolvedValue('mock_token');
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: testFixtures.user.id,
      email: testFixtures.user.email,
      type: 'email-verification',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
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
      (prismaService.refreshToken.create as any).mockResolvedValue({} as any);

      // Act
      const result = await service.signup(signupDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user.email).toBe(signupDto.email);
      expect(result.user.firstName).toBe(signupDto.firstName);
      expect(mockedHashPassword).toHaveBeenCalledWith(signupDto.password);
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

    it('should verify CAPTCHA token if provided', async () => {
      // Arrange
      const signupWithCaptcha = { ...signupDto, captchaToken: 'valid-captcha-token' };
      (prismaService.user.findUnique as any).mockResolvedValue(null);
      (prismaService.user.create as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
      } as any);
      (prismaService.userQuota.create as any).mockResolvedValue({} as any);
      (prismaService.refreshToken.create as any).mockResolvedValue({} as any);
      captchaService.verifyToken.mockResolvedValue(true);

      // Act
      await service.signup(signupWithCaptcha);

      // Assert
      expect(captchaService.verifyToken).toHaveBeenCalledWith('valid-captcha-token', 'register');
    });

    it('should throw BadRequestException if CAPTCHA verification fails', async () => {
      // Arrange
      const signupWithCaptcha = { ...signupDto, captchaToken: 'invalid-captcha-token' };
      captchaService.verifyToken.mockRejectedValue(new BadRequestException('CAPTCHA verification failed'));

      // Act & Assert
      await expect(service.signup(signupWithCaptcha)).rejects.toThrow(BadRequestException);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for weak password', async () => {
      // Arrange
      const weakPasswordDto = { ...signupDto, password: 'weak' };
      (prismaService.user.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.signup(weakPasswordDto)).rejects.toThrow(BadRequestException);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for password without uppercase', async () => {
      // Arrange
      const weakPasswordDto = { ...signupDto, password: 'password123!' };
      (prismaService.user.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.signup(weakPasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for password without special character', async () => {
      // Arrange
      const weakPasswordDto = { ...signupDto, password: 'Password123' };
      (prismaService.user.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.signup(weakPasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should hash password before saving', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(null);
      (prismaService.user.create as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
      } as any);
      (prismaService.userQuota.create as any).mockResolvedValue({} as any);
      (prismaService.refreshToken.create as any).mockResolvedValue({} as any);

      // Act
      await service.signup(signupDto);

      // Assert
      expect(mockedHashPassword).toHaveBeenCalledWith(signupDto.password);
      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
          }),
        }),
      );
    });

    it('should generate tokens after signup (via TokenService)', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(null);
      (prismaService.user.create as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
      } as any);
      (prismaService.userQuota.create as any).mockResolvedValue({} as any);
      tokenService.generateTokens.mockResolvedValue({
        accessToken: 'signed_access_token',
        refreshToken: 'signed_refresh_token',
      });

      // Act
      const result = await service.signup(signupDto);

      // Assert
      expect(result.accessToken).toBe('signed_access_token');
      expect(result.refreshToken).toBe('signed_refresh_token');
      expect(tokenService.generateTokens).toHaveBeenCalledWith(
        testFixtures.user.id,
        testFixtures.user.email,
        expect.any(String),
      );
      expect(tokenService.saveRefreshToken).toHaveBeenCalledWith(
        testFixtures.user.id,
        'signed_refresh_token',
      );
    });

    it('should queue verification email after signup (when not skipped)', async () => {
      const originalSkipEmail = process.env.SKIP_EMAIL_VERIFICATION;
      delete process.env.SKIP_EMAIL_VERIFICATION;

      try {
        (prismaService.user.findUnique as any).mockResolvedValue(null);
        (prismaService.user.create as any).mockResolvedValue({
          ...testFixtures.user,
          password: 'hashed_password',
          brand: testFixtures.brand,
        } as any);
        (prismaService.userQuota.create as any).mockResolvedValue({} as any);
        (jwtService.signAsync as jest.Mock).mockResolvedValue('verification-token');

        await service.signup(signupDto);

        expect(emailService.queueConfirmationEmail).toHaveBeenCalled();
      } finally {
        if (originalSkipEmail !== undefined) {
          process.env.SKIP_EMAIL_VERIFICATION = originalSkipEmail;
        }
      }
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const clientIp = '127.0.0.1';

    it('should login user with valid credentials', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
        is2FAEnabled: false,
      } as any);
      (prismaService.user.update as any).mockResolvedValue(testFixtures.user as any);
      (prismaService.refreshToken.create as any).mockResolvedValue({} as any);
      mockedVerifyPassword.mockResolvedValue({ isValid: true, needsRehash: false });
      bruteForceService.checkAndThrow.mockResolvedValue(undefined);

      // Act
      const result = await service.login(loginDto, clientIp);

      // Assert
      expect(result).toBeDefined();
      expect(result.user?.email).toBe(loginDto.email);
      expect(mockedVerifyPassword).toHaveBeenCalledWith(loginDto.password, 'hashed_password');
      expect(bruteForceService.checkAndThrow).toHaveBeenCalledWith(loginDto.email, clientIp);
      expect(bruteForceService.resetAttempts).toHaveBeenCalledWith(loginDto.email, clientIp);
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testFixtures.user.id },
          data: { lastLoginAt: expect.any(Date) },
        }),
      );
    });

    it('should check brute force protection before login', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
        is2FAEnabled: false,
      } as any);
      (prismaService.user.update as any).mockResolvedValue(testFixtures.user as any);
      (prismaService.refreshToken.create as any).mockResolvedValue({} as any);
      mockedVerifyPassword.mockResolvedValue({ isValid: true, needsRehash: false });
      bruteForceService.checkAndThrow.mockRejectedValue(new UnauthorizedException('Too many attempts'));

      // Act & Assert
      await expect(service.login(loginDto, clientIp)).rejects.toThrow(UnauthorizedException);
      expect(bruteForceService.checkAndThrow).toHaveBeenCalledWith(loginDto.email, clientIp);
    });

    it('should record failed attempt on invalid credentials', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(null);
      bruteForceService.checkAndThrow.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.login(loginDto, clientIp)).rejects.toThrow(UnauthorizedException);
      expect(bruteForceService.recordFailedAttempt).toHaveBeenCalledWith(loginDto.email, clientIp);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(null);
      bruteForceService.checkAndThrow.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.login(loginDto, clientIp)).rejects.toThrow(UnauthorizedException);
      expect(mockedVerifyPassword).not.toHaveBeenCalled();
      expect(bruteForceService.recordFailedAttempt).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
      } as any);
      mockedVerifyPassword.mockResolvedValue({ isValid: false, needsRehash: false });
      bruteForceService.checkAndThrow.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.login(loginDto, clientIp)).rejects.toThrow(UnauthorizedException);
      expect(mockedVerifyPassword).toHaveBeenCalled();
      expect(bruteForceService.recordFailedAttempt).toHaveBeenCalled();
    });

    it('should return temp token if 2FA is enabled', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
        is2FAEnabled: true,
      } as any);
      mockedVerifyPassword.mockResolvedValue({ isValid: true, needsRehash: false });
      bruteForceService.checkAndThrow.mockResolvedValue(undefined);
      (jwtService.signAsync as jest.Mock).mockResolvedValue('temp-2fa-token');

      // Act
      const result = await service.login(loginDto, clientIp);

      // Assert
      expect(result.requires2FA).toBe(true);
      expect(result.tempToken).toBeDefined();
      expect(bruteForceService.resetAttempts).toHaveBeenCalled();
    });

    it('should update lastLoginAt on successful login', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
        is2FAEnabled: false,
      } as any);
      (prismaService.user.update as any).mockResolvedValue(testFixtures.user as any);
      (prismaService.refreshToken.create as any).mockResolvedValue({} as any);
      mockedVerifyPassword.mockResolvedValue({ isValid: true, needsRehash: false });
      bruteForceService.checkAndThrow.mockResolvedValue(undefined);

      // Act
      await service.login(loginDto, clientIp);

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testFixtures.user.id },
          data: { lastLoginAt: expect.any(Date) },
        }),
      );
    });

    it('should block login when email not verified after 24h grace period', async () => {
      const oldCreatedAt = new Date(Date.now() - (25 * 60 * 60 * 1000)); // 25 hours ago
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'hashed_password',
        brand: testFixtures.brand,
        is2FAEnabled: false,
        emailVerified: false,
        createdAt: oldCreatedAt,
      } as any);
      mockedVerifyPassword.mockResolvedValue({ isValid: true, needsRehash: false });
      bruteForceService.checkAndThrow.mockResolvedValue(undefined);
      (configService.get as jest.Mock).mockImplementation((key: string) =>
        key === 'REQUIRE_EMAIL_VERIFICATION' ? 'true' : undefined,
      );

      await expect(service.login(loginDto, clientIp)).rejects.toThrow(UnauthorizedException);
      expect(bruteForceService.resetAttempts).toHaveBeenCalledWith(loginDto.email, clientIp);
      expect(prismaService.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token and queue email when user exists', async () => {
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        email: 'user@example.com',
      } as any);
      (jwtService.signAsync as jest.Mock).mockResolvedValue('reset-token-123');

      const result = await service.forgotPassword({ email: 'user@example.com' });

      expect(result.message).toContain('If an account with that email exists');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: testFixtures.user.id, type: 'password-reset' }),
        expect.any(Object),
      );
      expect(emailService.queuePasswordResetEmail).toHaveBeenCalledWith(
        'user@example.com',
        'reset-token-123',
        expect.stringContaining('reset-password?token=reset-token-123'),
        expect.any(Object),
      );
    });

    it('should return same message when user does not exist (no email enumeration)', async () => {
      (prismaService.user.findUnique as any).mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.message).toContain('If an account with that email exists');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(emailService.queuePasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refreshToken: 'valid_refresh_token',
    };

    it('should refresh tokens with valid refresh token (delegates to TokenService)', async () => {
      const expectedResult = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        user: { ...testFixtures.user, role: testFixtures.user.role as UserRole, brand: testFixtures.brand },
      };
      tokenService.refreshToken.mockResolvedValue(expectedResult as any);

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
      expect(result.user.email).toBe(testFixtures.user.email);
      expect(tokenService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      tokenService.refreshToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      expect(tokenService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });

    it('should throw UnauthorizedException if token record not found', async () => {
      tokenService.refreshToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      tokenService.refreshToken.mockRejectedValue(new UnauthorizedException('Token expired'));

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when refresh token reuse detected (TokenService revokes family)', async () => {
      tokenService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Refresh token has been revoked. Please login again.'),
      );

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should invalidate refresh token and revoke OAuth provider tokens', async () => {
      const userId = testFixtures.user.id;
      tokenService.logout.mockResolvedValue(undefined as any);
      oauthService.revokeProviderTokens.mockResolvedValue(undefined);

      await service.logout(userId);

      expect(oauthService.revokeProviderTokens).toHaveBeenCalledWith(userId);
      expect(tokenService.logout).toHaveBeenCalledWith(userId);
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
        type: 'email-verification', // Tiret au lieu d'underscore
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
      expect(result.verified).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testFixtures.user.id },
          data: { emailVerified: true },
        }),
      );
    });

    it('should throw BadRequestException if token is invalid', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'email-verification', // Tiret au lieu d'underscore
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
        type: 'password-reset',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'old_hashed_password',
      } as any);
      mockedVerifyPassword.mockResolvedValue({ isValid: false, needsRehash: false }); // New password different
      mockedHashPassword.mockResolvedValue('new_hashed_password');
      (prismaService.user.update as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'new_hashed_password',
      } as any);
      (prismaService.refreshToken.deleteMany as any).mockResolvedValue({} as any);

      // Act
      const result = await service.resetPassword(resetPasswordDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Password reset successfully');
      expect(mockedHashPassword).toHaveBeenCalledWith(resetPasswordDto.password);
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException if new password same as old', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'password-reset',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'old_hashed_password',
      } as any);
      mockedVerifyPassword.mockResolvedValue({ isValid: true, needsRehash: false }); // Same password

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
      expect(mockedHashPassword).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for weak password', async () => {
      // Arrange
      const weakPasswordDto = { ...resetPasswordDto, password: 'weak' };
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'password-reset',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'old_hashed_password',
      } as any);

      // Act & Assert
      await expect(service.resetPassword(weakPasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should delete all refresh tokens after password reset', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'password-reset',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        password: 'old_hashed_password',
      } as any);
      mockedVerifyPassword.mockResolvedValue({ isValid: false, needsRehash: false });
      mockedHashPassword.mockResolvedValue('new_hashed_password');
      (prismaService.user.update as any).mockResolvedValue(testFixtures.user as any);
      (prismaService.refreshToken.deleteMany as any).mockResolvedValue({} as any);

      await service.resetPassword(resetPasswordDto);

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: testFixtures.user.id },
      });
    });

    it('should throw BadRequestException when reset token is expired or invalid', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('jwt expired'));

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('loginWith2FA', () => {
    const login2FADto = {
      tempToken: 'valid-temp-token',
      token: '123456',
    };

    it('should login with valid 2FA token', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'temp-2fa',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        is2FAEnabled: true,
        twoFASecret: 'test-secret',
        backupCodes: [],
        brand: testFixtures.brand,
      } as any);
      (prismaService.user.update as any).mockResolvedValue(testFixtures.user as any);
      (prismaService.refreshToken.create as any).mockResolvedValue({} as any);
      twoFactorService.verifyToken.mockReturnValue(true);

      // Act
      const result = await service.loginWith2FA(login2FADto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(twoFactorService.verifyToken).toHaveBeenCalledWith('test-secret', '123456');
    });

    it('should throw UnauthorizedException for invalid 2FA token', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'temp-2fa',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        is2FAEnabled: true,
        twoFASecret: 'test-secret',
        backupCodes: [],
      } as any);
      twoFactorService.verifyToken.mockReturnValue(false);
      twoFactorService.validateBackupCode.mockResolvedValue({ isValid: false, matchedIndex: -1 });

      // Act & Assert
      await expect(service.loginWith2FA(login2FADto)).rejects.toThrow(UnauthorizedException);
    });

    it('should accept backup code if 2FA token invalid', async () => {
      // Arrange
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: testFixtures.user.id,
        email: testFixtures.user.email,
        type: 'temp-2fa',
      });
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        is2FAEnabled: true,
        twoFASecret: 'test-secret',
        backupCodes: ['BACKUP123'],
        brand: testFixtures.brand,
      } as any);
      (prismaService.user.update as any).mockResolvedValue(testFixtures.user as any);
      (prismaService.refreshToken.create as any).mockResolvedValue({} as any);
      twoFactorService.verifyToken.mockReturnValue(false);
      twoFactorService.validateBackupCode.mockResolvedValue({ isValid: true, matchedIndex: 0 });

      const backupCodeDto = { ...login2FADto, token: 'BACKUP123' };

      // Act
      const result = await service.loginWith2FA(backupCodeDto);

      // Assert
      expect(result).toBeDefined();
      expect(twoFactorService.validateBackupCode).toHaveBeenCalledWith(['BACKUP123'], 'BACKUP123');
    });
  });

  describe('setup2FA', () => {
    it('should generate 2FA secret and QR code', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        email: 'test@example.com',
      } as any);
      (prismaService.user.update as any).mockResolvedValue({
        ...testFixtures.user,
        temp2FASecret: 'test-secret',
        backupCodes: ['CODE1', 'CODE2'],
      } as any);
      twoFactorService.generateSecret.mockReturnValue({
        secret: 'test-secret',
        otpauthUrl: 'otpauth://totp/test',
      });
      twoFactorService.generateQRCode.mockResolvedValue('data:image/png;base64,test');

      // Act
      const result = await service.setup2FA(testFixtures.user.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.secret).toBe('test-secret');
      expect(result.qrCodeUrl).toBeDefined();
      expect(result.backupCodes).toHaveLength(10);
      expect(twoFactorService.generateSecret).toHaveBeenCalled();
      expect(twoFactorService.generateQRCode).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.setup2FA('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyAndEnable2FA', () => {
    const verify2FADto = {
      token: '123456',
    };

    it('should enable 2FA with valid token', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        temp2FASecret: 'test-secret',
        backupCodes: ['CODE1', 'CODE2'],
      } as any);
      (prismaService.user.update as any).mockResolvedValue({
        ...testFixtures.user,
        is2FAEnabled: true,
        twoFASecret: 'test-secret',
      } as any);
      twoFactorService.verifyToken.mockReturnValue(true);

      // Act
      const result = await service.verifyAndEnable2FA(testFixtures.user.id, verify2FADto);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('2FA enabled successfully');
      expect(twoFactorService.verifyToken).toHaveBeenCalledWith('test-secret', '123456');
    });

    it('should throw BadRequestException if 2FA setup not initiated', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        temp2FASecret: null,
      } as any);

      // Act & Assert
      await expect(service.verifyAndEnable2FA(testFixtures.user.id, verify2FADto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid 2FA code', async () => {
      // Arrange
      (prismaService.user.findUnique as any).mockResolvedValue({
        ...testFixtures.user,
        temp2FASecret: 'test-secret',
      } as any);
      twoFactorService.verifyToken.mockReturnValue(false);

      // Act & Assert
      await expect(service.verifyAndEnable2FA(testFixtures.user.id, verify2FADto)).rejects.toThrow(BadRequestException);
    });
  });
});

