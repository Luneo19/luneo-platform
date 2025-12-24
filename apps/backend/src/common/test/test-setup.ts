/**
 * Test Setup - Configuration et utilitaires pour les tests
 * Fournit des mocks, fixtures et helpers réutilisables
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/**
 * Type helper pour créer des mocks Jest typés avec toutes les méthodes Jest
 */
type JestMockFunction<T extends (...args: any[]) => any> = jest.Mock<
  ReturnType<T>,
  Parameters<T>
> & {
  mockResolvedValue: (value: Awaited<ReturnType<T>>) => JestMockFunction<T>;
  mockRejectedValue: (error: any) => JestMockFunction<T>;
  mockImplementation: (fn: T) => JestMockFunction<T>;
  mockReturnValue: (value: ReturnType<T>) => JestMockFunction<T>;
  mock: jest.MockContext<ReturnType<T>, Parameters<T>>;
};

/**
 * Crée un mock de méthode Prisma qui retourne une Promise
 * Compatible avec les méthodes Jest mockResolvedValue et mockRejectedValue
 */
const createPrismaMock = <T = any>(): jest.MockedFunction<(...args: any[]) => Promise<T>> & {
  mockResolvedValue: (value: T) => jest.MockedFunction<(...args: any[]) => Promise<T>>;
  mockRejectedValue: (error: any) => jest.MockedFunction<(...args: any[]) => Promise<T>>;
} => {
  const mockFn = jest.fn<Promise<T>, any[]>() as any;
  // S'assurer que mockResolvedValue et mockRejectedValue sont disponibles
  mockFn.mockResolvedValue = (value: T) => {
    mockFn.mockReturnValue(Promise.resolve(value));
    return mockFn;
  };
  mockFn.mockRejectedValue = (error: any) => {
    mockFn.mockReturnValue(Promise.reject(error));
    return mockFn;
  };
  return mockFn;
};

/**
 * Mock PrismaService pour les tests
 * Typé correctement pour supporter les méthodes Jest
 */
export const createMockPrismaService = () => {
  const createMockDelegate = () => ({
    findUnique: createPrismaMock(),
    findMany: createPrismaMock(),
    create: createPrismaMock(),
    update: createPrismaMock(),
    delete: createPrismaMock(),
    count: createPrismaMock<number>(),
  });

  return {
    user: createMockDelegate(),
    product: createMockDelegate(),
    design: createMockDelegate(),
    order: createMockDelegate(),
    brand: {
      findUnique: createPrismaMock(),
      findMany: createPrismaMock(),
      create: createPrismaMock(),
      update: createPrismaMock(),
    },
    auditLog: {
      findMany: createPrismaMock(),
      create: createPrismaMock(),
      count: createPrismaMock<number>(),
    },
    refreshToken: {
      findUnique: createPrismaMock(),
      create: createPrismaMock(),
      delete: createPrismaMock(),
      deleteMany: createPrismaMock(),
    },
    userQuota: {
      findUnique: createPrismaMock(),
      create: createPrismaMock(),
      update: createPrismaMock(),
    },
    $connect: createPrismaMock(),
    $disconnect: createPrismaMock(),
    $transaction: createPrismaMock(),
  };
};

/**
 * Mock RedisOptimizedService pour les tests
 */
export const createMockRedisService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  getRedis: jest.fn(() => ({
    zadd: jest.fn(),
    zremrangebyscore: jest.fn(),
    zcard: jest.fn(),
    zrange: jest.fn(),
    del: jest.fn(),
  })),
});

/**
 * Mock SmartCacheService pour les tests
 */
export const createMockCacheService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn(),
  invalidateByTags: jest.fn(),
  invalidateByPattern: jest.fn(),
  getOrSet: jest.fn(),
  getSimple: jest.fn(),
  setSimple: jest.fn(),
  delSimple: jest.fn(),
});

/**
 * Mock ConfigService pour les tests
 */
export const createMockConfigService = (overrides: Record<string, unknown> = {}) => ({
  get: jest.fn((key: string) => {
    const defaults: Record<string, unknown> = {
      'database.url': 'postgresql://test:test@localhost:5432/test',
      'redis.url': 'redis://localhost:6379',
      'jwt.secret': 'test-secret',
      'jwt.expiresIn': '15m',
      'app.nodeEnv': 'test',
      'app.rateLimitTtl': 60,
      'app.rateLimitLimit': 100,
      ...overrides,
    };
    return defaults[key];
  }),
});

/**
 * Mock JwtService pour les tests
 */
export const createMockJwtService = () => ({
  sign: jest.fn(),
  signAsync: jest.fn().mockResolvedValue('mock_token'),
  verify: jest.fn(),
  verifyAsync: jest.fn().mockResolvedValue({ sub: 'user_123', email: 'test@example.com', role: 'CONSUMER' }),
  decode: jest.fn(),
});

/**
 * Crée un module de test avec les mocks de base
 */
export async function createTestingModule(providers: any[] = [], imports: any[] = []) {
  const module: TestingModule = await Test.createTestingModule({
    imports,
    providers: [
      ...providers,
      {
        provide: PrismaService,
        useValue: createMockPrismaService(),
      },
      {
        provide: RedisOptimizedService,
        useValue: createMockRedisService(),
      },
      {
        provide: SmartCacheService,
        useValue: createMockCacheService(),
      },
      {
        provide: ConfigService,
        useValue: createMockConfigService(),
      },
      {
        provide: JwtService,
        useValue: createMockJwtService(),
      },
    ],
  }).compile();

  return module;
}

/**
 * Fixtures pour les tests
 */
export const testFixtures = {
  user: {
    id: 'user_123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'CONSUMER',
    brandId: 'brand_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  brand: {
    id: 'brand_123',
    name: 'Test Brand',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  product: {
    id: 'prod_123',
    name: 'Test Product',
    description: 'Test Description',
    price: 29.99,
    brandId: 'brand_123',
    isActive: true,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  design: {
    id: 'design_123',
    prompt: 'Test design prompt',
    status: 'COMPLETED',
    userId: 'user_123',
    brandId: 'brand_123',
    productId: 'prod_123',
    previewUrl: 'https://example.com/preview.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  order: {
    id: 'order_123',
    orderNumber: 'ORD-123',
    status: 'PAID',
    customerEmail: 'customer@example.com',
    totalCents: 2999,
    currency: 'EUR',
    brandId: 'brand_123',
    productId: 'prod_123',
    designId: 'design_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  currentUser: {
    id: 'user_123',
    email: 'test@example.com',
    role: 'CONSUMER' as const,
    brandId: 'brand_123',
  },
};

/**
 * Helpers pour les assertions
 */
export const testHelpers = {
  /**
   * Vérifie qu'une erreur AppError a été lancée
   */
  expectAppError: (error: unknown, code?: string, statusCode?: number) => {
    expect(error).toBeDefined();
    if (code) {
      expect((error as { code: string }).code).toBe(code);
    }
    if (statusCode) {
      expect((error as { getStatus: () => number }).getStatus()).toBe(statusCode);
    }
  },

  /**
   * Vérifie qu'une erreur NotFound a été lancée
   */
  expectNotFound: (error: unknown, resourceType?: string) => {
    expect(error).toBeDefined();
    expect((error as { code: string }).code).toContain('NOTFOUND');
    if (resourceType) {
      expect((error as { message: string }).message).toContain(resourceType);
    }
  },

  /**
   * Vérifie qu'une erreur d'autorisation a été lancée
   */
  expectForbidden: (error: unknown) => {
    expect(error).toBeDefined();
    expect((error as { getStatus: () => number }).getStatus()).toBe(403);
  },
};

