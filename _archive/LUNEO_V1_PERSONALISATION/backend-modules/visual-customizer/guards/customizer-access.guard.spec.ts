/**
 * CustomizerAccessGuard unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { CustomizerAccessGuard } from './customizer-access.guard';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('CustomizerAccessGuard', () => {
  let guard: CustomizerAccessGuard;
  let _prisma: PrismaService;

  const mockPrisma = {
    visualCustomizer: {
      findUnique: jest.fn(),
    },
  };

  const createMockContext = (
    customizerId: string,
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    const request = {
      params: { id: customizerId },
      headers,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomizerAccessGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<CustomizerAccessGuard>(CustomizerAccessGuard);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow published public customizer', async () => {
      const customizerId = 'customizer-1';
      const customizer = {
        id: customizerId,
        status: 'PUBLISHED',
        isPublic: true,
        isPasswordProtected: false,
        password: null,
        allowedDomains: null,
        expiresAt: null,
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny draft customizer', async () => {
      const customizerId = 'customizer-1';
      const customizer = {
        id: customizerId,
        status: 'DRAFT',
        isPublic: true,
        isPasswordProtected: false,
        password: null,
        allowedDomains: null,
        expiresAt: null,
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /not published/,
      );
    });

    it('should deny expired customizer', async () => {
      const customizerId = 'customizer-1';
      const expiredDate = new Date('2020-01-01');
      const customizer = {
        id: customizerId,
        status: 'PUBLISHED',
        isPublic: true,
        isPasswordProtected: false,
        password: null,
        allowedDomains: null,
        expiresAt: expiredDate,
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(/expired/);
    });

    it('should check allowed domains', async () => {
      const customizerId = 'customizer-1';
      const customizer = {
        id: customizerId,
        status: 'PUBLISHED',
        isPublic: true,
        isPasswordProtected: false,
        password: null,
        allowedDomains: ['example.com'],
        expiresAt: null,
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId, {
        origin: 'https://example.com',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access from disallowed domain', async () => {
      const customizerId = 'customizer-1';
      const customizer = {
        id: customizerId,
        status: 'PUBLISHED',
        isPublic: true,
        isPasswordProtected: false,
        password: null,
        allowedDomains: ['example.com'],
        expiresAt: null,
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId, {
        origin: 'https://malicious.com',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /origin domain not allowed/,
      );
    });

    it('should check password protection', async () => {
      const customizerId = 'customizer-1';
      const customizer = {
        id: customizerId,
        status: 'PUBLISHED',
        isPublic: true,
        isPasswordProtected: true,
        password: 'secret123',
        allowedDomains: null,
        expiresAt: null,
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId, {
        'x-customizer-password': 'secret123',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access with wrong password', async () => {
      const customizerId = 'customizer-1';
      const customizer = {
        id: customizerId,
        status: 'PUBLISHED',
        isPublic: true,
        isPasswordProtected: true,
        password: 'secret123',
        allowedDomains: null,
        expiresAt: null,
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId, {
        'x-customizer-password': 'wrong',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /Invalid password/,
      );
    });

    it('should require password when customizer is password protected', async () => {
      const customizerId = 'customizer-1';
      const customizer = {
        id: customizerId,
        status: 'PUBLISHED',
        isPublic: true,
        isPasswordProtected: true,
        password: 'secret123',
        allowedDomains: null,
        expiresAt: null,
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /Password required/,
      );
    });

    it('should throw NotFoundException when customizer not found', async () => {
      const customizerId = 'missing';

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(null);

      const context = createMockContext(customizerId);

      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should deny inactive customizer', async () => {
      const customizerId = 'customizer-1';
      const customizer = {
        id: customizerId,
        status: 'PUBLISHED',
        isPublic: true,
        isPasswordProtected: false,
        password: null,
        allowedDomains: null,
        expiresAt: null,
        isActive: false,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(/not active/);
    });
  });
});
