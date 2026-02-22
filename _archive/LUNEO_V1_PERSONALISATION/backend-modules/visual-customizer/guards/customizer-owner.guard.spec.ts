/**
 * CustomizerOwnerGuard unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { CustomizerOwnerGuard } from './customizer-owner.guard';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('CustomizerOwnerGuard', () => {
  let guard: CustomizerOwnerGuard;
  let _prisma: PrismaService;

  const mockPrisma = {
    visualCustomizer: {
      findUnique: jest.fn(),
    },
    teamMember: {
      findFirst: jest.fn(),
    },
  };

  const createMockContext = (
    customizerId: string,
    user: { id: string; brandId?: string; role?: string },
  ): ExecutionContext => {
    const request = {
      params: { id: customizerId },
      user,
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
        CustomizerOwnerGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<CustomizerOwnerGuard>(CustomizerOwnerGuard);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow admin bypass', async () => {
      const customizerId = 'customizer-1';
      const user = {
        id: 'user-1',
        brandId: 'brand-other',
        role: UserRole.PLATFORM_ADMIN,
      };
      const customizer = {
        id: customizerId,
        brandId: 'brand-1',
        status: 'PUBLISHED',
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId, user);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrisma.visualCustomizer.findUnique).toHaveBeenCalledWith({
        where: { id: customizerId },
        select: expect.any(Object),
      });
    });

    it('should allow owner access', async () => {
      const customizerId = 'customizer-1';
      const user = {
        id: 'user-1',
        brandId: 'brand-1',
        role: 'USER',
      };
      const customizer = {
        id: customizerId,
        brandId: 'brand-1',
        status: 'PUBLISHED',
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);

      const context = createMockContext(customizerId, user);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny non-owner access', async () => {
      const customizerId = 'customizer-1';
      const user = {
        id: 'user-1',
        brandId: 'brand-other',
        role: 'USER',
      };
      const customizer = {
        id: customizerId,
        brandId: 'brand-1',
        status: 'PUBLISHED',
        isActive: true,
        deletedAt: null,
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      const context = createMockContext(customizerId, user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /Access denied/,
      );
    });

    it('should throw NotFoundException for missing customizer', async () => {
      const customizerId = 'missing';
      const user = {
        id: 'user-1',
        brandId: 'brand-1',
        role: 'USER',
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(null);

      const context = createMockContext(customizerId, user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /Customizer not found/,
      );
    });

    it('should allow team member access', async () => {
      const customizerId = 'customizer-1';
      const user = {
        id: 'user-1',
        brandId: 'brand-other',
        role: 'USER',
      };
      const customizer = {
        id: customizerId,
        brandId: 'brand-1',
        status: 'PUBLISHED',
        isActive: true,
        deletedAt: null,
      };
      const teamMember = {
        id: 'tm-1',
        userId: 'user-1',
        organizationId: 'brand-1',
        status: 'active',
      };

      mockPrisma.visualCustomizer.findUnique.mockResolvedValue(customizer);
      mockPrisma.teamMember.findFirst.mockResolvedValue(teamMember);

      const context = createMockContext(customizerId, user);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user not authenticated', async () => {
      const customizerId = 'customizer-1';
      const context = createMockContext(customizerId, null as unknown);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /User not authenticated/,
      );
    });
  });
});
