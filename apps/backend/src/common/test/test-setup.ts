/**
 * Test Setup - Configuration et utilitaires pour les tests
 * Fournit des mocks, fixtures et helpers réutilisables
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { StorageService } from '@/libs/storage/storage.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';
import { DiscountService } from '@/modules/orders/services/discount.service';
import { CommissionService } from '@/modules/billing/services/commission.service';
import { ReferralService } from '@/modules/referral/referral.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getQueueToken } from '@nestjs/bull';

/**
 * Crée un mock de méthode Prisma qui retourne une Promise
 * Compatible avec les méthodes Jest mockResolvedValue et mockRejectedValue
 */
const createPrismaMock = <T = unknown>(): jest.MockedFunction<(...args: unknown[]) => Promise<T>> & {
  mockResolvedValue: (value: T) => jest.MockedFunction<(...args: unknown[]) => Promise<T>>;
  mockRejectedValue: (error: unknown) => jest.MockedFunction<(...args: unknown[]) => Promise<T>>;
} => {
  type PrismaMockFn = jest.Mock<Promise<T>, unknown[]> & {
    mockResolvedValue: (value: T) => PrismaMockFn;
    mockRejectedValue: (error: unknown) => PrismaMockFn;
  };
  const mockFn = jest.fn<Promise<T>, unknown[]>() as unknown as PrismaMockFn;
  mockFn.mockResolvedValue = (value: T) => {
    mockFn.mockReturnValue(Promise.resolve(value));
    return mockFn;
  };
  mockFn.mockRejectedValue = (error: unknown) => {
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
    findFirst: createPrismaMock(),
    findMany: createPrismaMock(),
    create: createPrismaMock(),
    update: createPrismaMock(),
    upsert: createPrismaMock(),
    delete: createPrismaMock(),
    deleteMany: createPrismaMock(),
    count: createPrismaMock<number>(),
  });

  return {
    user: createMockDelegate(),
    product: createMockDelegate(),
    design: createMockDelegate(),
    order: createMockDelegate(),
    brand: {
      findUnique: createPrismaMock(),
      findFirst: createPrismaMock(),
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
      findFirst: createPrismaMock(),
      create: createPrismaMock(),
      delete: createPrismaMock(),
      deleteMany: createPrismaMock(),
    },
    userQuota: {
      findUnique: createPrismaMock(),
      findFirst: createPrismaMock(),
      create: createPrismaMock(),
      update: createPrismaMock(),
    },
    ecommerceIntegration: createMockDelegate(),
    webhook: createMockDelegate(),
    webhookLog: createMockDelegate(),
    productMapping: createMockDelegate(),
    customDomain: createMockDelegate(),
    creatorProfile: createMockDelegate(),
    slaSupportTicket: createMockDelegate(),
    slaSupportPriority: createMockDelegate(),
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
  // get(key, namespace, factory) - execute factory to get data
  get: jest.fn().mockImplementation(async (key: string, namespace: string, factory: () => Promise<unknown>) => {
    if (typeof factory === 'function') {
      return factory();
    }
    return null;
  }),
  set: jest.fn(),
  invalidate: jest.fn(),
  invalidateByTags: jest.fn(),
  invalidateByPattern: jest.fn(),
  getOrSet: jest.fn().mockImplementation(async (key: string, factory: () => Promise<unknown>) => {
    if (typeof factory === 'function') {
      return factory();
    }
    return null;
  }),
  getSimple: jest.fn(),
  setSimple: jest.fn(),
  delSimple: jest.fn(),
});

/**
 * Mock ConfigService pour les tests
 */
export const createMockConfigService = (overrides: Record<string, unknown> = {}) => {
  const defaults: Record<string, unknown> = {
    'database.url': 'postgresql://test:test@localhost:5432/test',
    'redis.url': 'redis://localhost:6379',
    'jwt.secret': 'test-secret',
    'jwt.expiresIn': '15m',
    'app.nodeEnv': 'test',
    'app.rateLimitTtl': 60,
    'app.rateLimitLimit': 100,
    SHOPIFY_CLIENT_ID: 'test-client-id',
    SHOPIFY_CLIENT_SECRET: 'test-client-secret',
    SHOPIFY_WEBHOOK_SECRET: 'test-webhook-secret',
    RECAPTCHA_SECRET_KEY: 'test-recaptcha-key',
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => defaults[key]),
    getOrThrow: jest.fn((key: string) => {
      if (key in defaults) return defaults[key];
      throw new Error(`Config key "${key}" not found`);
    }),
  };
};

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
 * Mock StorageService pour les tests
 */
export const createMockStorageService = () => ({
  uploadFile: jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/file.png', key: 'file-key' }),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  getSignedUrl: jest.fn().mockResolvedValue('https://cdn.example.com/signed-url'),
  uploadBuffer: jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/buffer.png' }),
});

/**
 * Mock HttpService pour les tests
 */
export const createMockHttpService = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn(),
  axiosRef: { get: jest.fn(), post: jest.fn(), request: jest.fn() },
});

/**
 * Mock EventEmitter2 pour les tests
 */
export const createMockEventEmitter = () => ({
  emit: jest.fn(),
  emitAsync: jest.fn().mockResolvedValue([]),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
});

/**
 * Mock EmailService pour les tests
 */
export const createMockEmailService = () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordReset: jest.fn().mockResolvedValue({ success: true }),
  sendWelcome: jest.fn().mockResolvedValue({ success: true }),
  sendVerification: jest.fn().mockResolvedValue({ success: true }),
});

/**
 * Mock EncryptionService pour les tests
 */
export const createMockEncryptionService = () => ({
  encrypt: jest.fn().mockReturnValue('encrypted_data'),
  decrypt: jest.fn().mockReturnValue('decrypted_data'),
  hash: jest.fn().mockResolvedValue('hashed_value'),
  compare: jest.fn().mockResolvedValue(true),
});

/**
 * Mock BullMQ Queue pour les tests
 */
export const createMockQueue = () => ({
  add: jest.fn().mockResolvedValue({ id: 'job_123' }),
  addBulk: jest.fn().mockResolvedValue([{ id: 'job_123' }]),
  getJob: jest.fn().mockResolvedValue(null),
  getJobs: jest.fn().mockResolvedValue([]),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  obliterate: jest.fn().mockResolvedValue(undefined),
});

/**
 * Mock DiscountService pour les tests
 */
export const createMockDiscountService = () => ({
  calculateDiscount: jest.fn().mockResolvedValue({ discountAmount: 0, discountPercent: 0 }),
  validateCode: jest.fn().mockResolvedValue({ valid: true }),
  applyDiscount: jest.fn().mockResolvedValue({ finalAmount: 100 }),
});

/**
 * Mock CommissionService pour les tests
 */
export const createMockCommissionService = () => ({
  calculateCommission: jest.fn().mockResolvedValue({ amount: 10, rate: 0.1 }),
  recordCommission: jest.fn().mockResolvedValue({ id: 'commission_123' }),
  getCommissionPercent: jest.fn().mockResolvedValue(10), // 10% commission
  calculateCommissionCents: jest.fn().mockReturnValue(100), // $1 in cents
});

/**
 * Mock ReferralService pour les tests
 */
export const createMockReferralService = () => ({
  processReferral: jest.fn().mockResolvedValue({ credited: true }),
  validateReferralCode: jest.fn().mockResolvedValue({ valid: true }),
});

/**
 * Crée un module de test avec les mocks de base
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NestJS Test.createTestingModule expects flexible types
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
      {
        provide: StorageService,
        useValue: createMockStorageService(),
      },
      {
        provide: HttpService,
        useValue: createMockHttpService(),
      },
      {
        provide: EventEmitter2,
        useValue: createMockEventEmitter(),
      },
      {
        provide: EncryptionService,
        useValue: createMockEncryptionService(),
      },
      {
        provide: getQueueToken('integration-sync'),
        useValue: createMockQueue(),
      },
      {
        provide: getQueueToken('ai-generation'),
        useValue: createMockQueue(),
      },
      {
        provide: getQueueToken('email'),
        useValue: createMockQueue(),
      },
      {
        provide: DiscountService,
        useValue: createMockDiscountService(),
      },
      {
        provide: CommissionService,
        useValue: createMockCommissionService(),
      },
      {
        provide: ReferralService,
        useValue: createMockReferralService(),
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

