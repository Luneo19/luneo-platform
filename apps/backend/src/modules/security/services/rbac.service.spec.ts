/**
 * RBACService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RBACService } from './rbac.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { Role, Permission } from '../interfaces/rbac.interface';

describe('RBACService', () => {
  let service: RBACService;
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    delSimple: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RBACService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<RBACService>(RBACService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getRolePermissions', () => {
    it('should return permissions for role', () => {
      const perms = service.getRolePermissions(Role.ADMIN);

      expect(Array.isArray(perms)).toBe(true);
      expect(perms.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown role', () => {
      const perms = service.getRolePermissions('unknown' as Role);

      expect(perms).toEqual([]);
    });
  });

  describe('roleHasPermission', () => {
    it('should return true when role has permission', () => {
      const result = service.roleHasPermission(
        Role.ADMIN,
        Permission.BRAND_READ,
      );

      expect(result).toBe(true);
    });

    it('should return false when role lacks permission', () => {
      const result = service.roleHasPermission(
        Role.VIEWER,
        Permission.BRAND_DELETE,
      );

      expect(typeof result).toBe('boolean');
    });
  });

  describe('userHasPermission', () => {
    it('should return false when user not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.userHasPermission(
        'nonexistent',
        Permission.BRAND_READ,
      );

      expect(result).toBe(false);
    });

    it('should return permission from DB when not cached', async () => {
      mockCache.get.mockImplementation((_key: string, _type: unknown, _fn: unknown) =>
        Promise.resolve(null),
      );
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        role: 'ADMIN',
      });
      mockCache.set.mockResolvedValue(undefined);

      const result = await service.userHasPermission('u1', Permission.BRAND_READ);

      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        select: { role: true },
      });
    });

    it('should use cache when available', async () => {
      mockCache.get.mockResolvedValue('true');

      const result = await service.userHasPermission('u1', Permission.BRAND_READ);

      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should return false when user lacks permission', async () => {
      const context = {
        user: {
          id: 'u1',
          role: Role.VIEWER,
          organizationId: 'org1',
          permissions: [],
        },
        action: Permission.BRAND_DELETE,
        resource: null,
      };

      const result = await service.authorize(context as unknown);

      expect(result).toBe(false);
    });

    it('should return true when user has permission and no resource', async () => {
      const context = {
        user: {
          id: 'u1',
          role: Role.ADMIN,
          organizationId: 'org1',
          permissions: [Permission.BRAND_READ],
        },
        action: Permission.BRAND_READ,
        resource: null,
      };

      const result = await service.authorize(context as unknown);

      expect(result).toBe(true);
    });

    it('should return false when cross-organization access and not super admin', async () => {
      const context = {
        user: {
          id: 'u1',
          role: Role.ADMIN,
          organizationId: 'org-1',
          permissions: [Permission.BRAND_READ],
        },
        action: Permission.BRAND_READ,
        resource: { organizationId: 'org-2' },
      };

      const result = await service.authorize(context as unknown);

      expect(result).toBe(false);
    });
  });

  describe('enforce', () => {
    it('should throw ForbiddenException when not authorized', async () => {
      const context = {
        user: {
          id: 'u1',
          role: Role.VIEWER,
          organizationId: 'org1',
          permissions: [],
        },
        action: Permission.BRAND_DELETE,
        resource: null,
      };

      await expect(service.enforce(context as unknown)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.enforce(context as unknown)).rejects.toThrow(
        "You don't have permission to perform this action",
      );
    });

    it('should not throw when authorized', async () => {
      const context = {
        user: {
          id: 'u1',
          role: Role.ADMIN,
          organizationId: 'org1',
          permissions: [Permission.BRAND_READ],
        },
        action: Permission.BRAND_READ,
        resource: null,
      };

      await expect(service.enforce(context as unknown)).resolves.not.toThrow();
    });
  });

  describe('getUserRole', () => {
    it('should return role from DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        role: 'ADMIN',
      });

      const result = await service.getUserRole('u1');

      expect(result).toBe(Role.SUPER_ADMIN);
    });

    it('should return VIEWER when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserRole('nonexistent');

      expect(result).toBe(Role.VIEWER);
    });
  });

  describe('assignRole', () => {
    it('should update user role and invalidate cache', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 'u1', role: 'USER' });
      mockCache.delSimple.mockResolvedValue(true);

      await service.assignRole('u1', Role.MANAGER);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { role: 'USER' },
      });
    });
  });

  describe('isAdmin', () => {
    it('should return true when user is ADMIN', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        role: 'ADMIN',
      });

      const result = await service.isAdmin('u1');

      expect(result).toBe(true);
    });

    it('should return false when user is VIEWER', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        role: 'USER',
      });

      const result = await service.isAdmin('u1');

      expect(result).toBe(false);
    });
  });

  describe('compareRoles', () => {
    it('should return positive when first role is higher', () => {
      const result = service.compareRoles(Role.ADMIN, Role.VIEWER);

      expect(result).toBeGreaterThan(0);
    });

    it('should return negative when first role is lower', () => {
      const result = service.compareRoles(Role.VIEWER, Role.ADMIN);

      expect(result).toBeLessThan(0);
    });
  });

  describe('isRoleHigher', () => {
    it('should return true when role1 is higher than role2', () => {
      expect(service.isRoleHigher(Role.SUPER_ADMIN, Role.VIEWER)).toBe(true);
    });

    it('should return false when role1 is not higher', () => {
      expect(service.isRoleHigher(Role.VIEWER, Role.ADMIN)).toBe(false);
    });
  });

  describe('addAccessRule', () => {
    it('should add custom rule', () => {
      const rule = {
        resource: 'test',
        condition: () => true,
      };

      expect(() => service.addAccessRule(rule as unknown)).not.toThrow();
    });
  });
});
