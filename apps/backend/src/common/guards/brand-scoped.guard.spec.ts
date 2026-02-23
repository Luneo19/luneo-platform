/**
 * BrandScopedGuard Unit Tests
 * Tests read-only mode: block POST when readOnlyMode, allow GET and billing/credits/auth/health
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@prisma/client';
import { BrandScopedGuard } from './brand-scoped.guard';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('BrandScopedGuard', () => {
  let guard: BrandScopedGuard;
  let reflector: Reflector;
  const mockPrisma = {
    brand: { findUnique: jest.fn() },
  };

  function createContext(overrides: {
    method?: string;
    path?: string;
    user?: { id: string; brandId: string; role: PlatformRole };
    params?: Record<string, string>;
  } = {}): ExecutionContext {
    const method = overrides.method ?? 'GET';
    const path = overrides.path ?? '/api/designs';
    const user = overrides.user ?? { id: 'u1', organizationId: 'brand-1', role: PlatformRole.ADMIN };
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          route: { path },
          url: path,
          path,
          params: overrides.params ?? { organizationId: 'brand-1' },
          user,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandScopedGuard,
        { provide: PrismaService, useValue: mockPrisma },
        Reflector,
      ],
    }).compile();

    guard = module.get<BrandScopedGuard>(BrandScopedGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('read-only mode', () => {
    it('should block POST when readOnlyMode is true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockPrisma.brand.findUnique.mockResolvedValue({ readOnlyMode: true });
      const ctx = createContext({ method: 'POST', path: '/api/designs' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(ctx)).rejects.toThrow(/read-only mode|unpaid subscription/);
    });

    it('should allow GET when readOnlyMode is true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockPrisma.brand.findUnique.mockResolvedValue({ readOnlyMode: true });
      const ctx = createContext({ method: 'GET', path: '/api/designs' });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should allow billing endpoints when readOnlyMode is true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockPrisma.brand.findUnique.mockResolvedValue({ readOnlyMode: true });
      const ctx = createContext({ method: 'POST', path: '/api/v1/billing/update-payment' });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should allow credits endpoints when readOnlyMode is true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockPrisma.brand.findUnique.mockResolvedValue({ readOnlyMode: true });
      const ctx = createContext({ method: 'POST', path: '/api/v1/credits/purchase' });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should allow auth endpoints when readOnlyMode is true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockPrisma.brand.findUnique.mockResolvedValue({ readOnlyMode: true });
      const ctx = createContext({ method: 'POST', path: '/api/v1/auth/refresh' });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should allow when readOnlyMode is false', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ readOnlyMode: false });
      const ctx = createContext({ method: 'POST', path: '/api/designs' });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });
  });
});
