/**
 * Mutation Testing - Auth Module
 * Tests mutation testing on critical auth functions
 * 
 * Run with: npx stryker run stryker.conf.json
 */

import { AuthService } from '@/modules/auth/auth.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

describe('Mutation Testing - AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            userQuota: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'jwt.secret': 'test-secret',
                'jwt.refreshSecret': 'test-refresh-secret',
                'jwt.expiresIn': '15m',
                'jwt.refreshExpiresIn': '7d',
                'app.frontendUrl': 'https://app.luneo.app',
              };
              return config[key];
            }),
          },
        },
        {
          provide: 'EmailService',
          useValue: {
            sendConfirmationEmail: jest.fn(),
          },
        },
        {
          provide: 'BruteForceService',
          useValue: {
            checkAndThrow: jest.fn(),
            recordFailedAttempt: jest.fn(),
            resetAttempts: jest.fn(),
          },
        },
        {
          provide: 'TwoFactorService',
          useValue: {
            verifyToken: jest.fn(),
          },
        },
        {
          provide: 'CaptchaService',
          useValue: {
            verifyToken: jest.fn(),
            isEnabled: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('isPasswordStrong - Mutation Testing', () => {
    it('should detect weak passwords', () => {
      // These tests help detect if password validation logic is mutated incorrectly
      expect(service['isPasswordStrong']('weak')).toBe(false);
      expect(service['isPasswordStrong']('password')).toBe(false);
      expect(service['isPasswordStrong']('Password')).toBe(false);
      expect(service['isPasswordStrong']('Password123')).toBe(false);
      expect(service['isPasswordStrong']('Password123!')).toBe(true);
    });
  });

  describe('generateTokens - Mutation Testing', () => {
    it('should generate both access and refresh tokens', async () => {
      (jwtService.signAsync as jest.Mock).mockResolvedValueOnce('access-token');
      (jwtService.signAsync as jest.Mock).mockResolvedValueOnce('refresh-token');

      const tokens = await service['generateTokens']('user-id', 'user@example.com', 'CONSUMER');

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens.accessToken).toBe('access-token');
      expect(tokens.refreshToken).toBe('refresh-token');
    });
  });
});
