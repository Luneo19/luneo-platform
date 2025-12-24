/**
 * CacheableInterceptor - Tests unitaires
 * Tests pour le système de cache automatique
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { CacheableInterceptor } from './cacheable.interceptor';
import { SmartCacheService } from './smart-cache.service';
import { Reflector } from '@nestjs/core';
import { CACHEABLE_METADATA, CACHE_INVALIDATE_METADATA } from './cacheable.decorator';
import { createMockCacheService } from '@/common/test/test-setup';

describe('CacheableInterceptor', () => {
  let interceptor: CacheableInterceptor;
  let cacheService: jest.Mocked<SmartCacheService>;
  let reflector: jest.Mocked<Reflector>;
  let executionContext: jest.Mocked<ExecutionContext>;
  let callHandler: jest.Mocked<CallHandler>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheableInterceptor,
        {
          provide: SmartCacheService,
          useValue: createMockCacheService(),
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<CacheableInterceptor>(CacheableInterceptor);
    cacheService = module.get(SmartCacheService);
    reflector = module.get(Reflector);

    // Setup execution context mock
    function testHandler() {}
    Object.defineProperty(testHandler, 'name', { value: 'testHandler' });
    executionContext = {
      getHandler: jest.fn(() => testHandler),
      getClass: jest.fn(() => class TestClass {}),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({
          params: {},
          query: {},
          body: {},
        })),
      })),
      getArgs: jest.fn(() => []),
    } as any;

    callHandler = {
      handle: jest.fn(() => of({ data: 'test' })),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cacheable', () => {
    it('should return cached data if available', async () => {
      // Arrange
      reflector.get
        .mockReturnValueOnce({
          type: 'api',
          ttl: 3600,
          keyGenerator: () => 'test-key',
        }) // cacheable
        .mockReturnValueOnce(null); // cacheInvalidate
      const cachedData = 'cached data';
      cacheService.get.mockResolvedValue(cachedData);

      // Act
      const result = await interceptor.intercept(executionContext, callHandler);

      // Assert
      // Wait for Observable to subscribe and execute
      await new Promise<void>((resolve) => {
        result.subscribe((data) => {
          expect(data).toEqual(cachedData);
          expect(cacheService.get).toHaveBeenCalled();
          expect(callHandler.handle).not.toHaveBeenCalled();
          resolve();
        });
      });
    });

    it('should execute handler and cache result if cache miss', async () => {
      // Arrange
      reflector.get
        .mockReturnValueOnce({
          type: 'api',
          ttl: 3600,
          keyGenerator: () => 'test-key',
        }) // cacheable
        .mockReturnValueOnce(null); // cacheInvalidate
      const handlerResult = { data: 'new data' };
      callHandler.handle.mockReturnValue(of(handlerResult));
      
      // Mock cache.get to call fetchFn on cache miss
      cacheService.get.mockImplementation(async (key, type, fetchFn) => {
        if (fetchFn) {
          // fetchFn returns a Promise that resolves when the Observable emits
          return await fetchFn();
        }
        return null;
      });

      // Act
      const result = await interceptor.intercept(executionContext, callHandler);

      // Assert
      // Wait for Observable to subscribe and execute
      await new Promise<void>((resolve) => {
        result.subscribe(async (data) => {
          expect(data).toEqual(handlerResult);
          expect(cacheService.get).toHaveBeenCalled();
          expect(callHandler.handle).toHaveBeenCalled();
          // Wait a bit for cache.set to be called
          await new Promise((r) => setTimeout(r, 10));
          expect(cacheService.set).toHaveBeenCalled();
          resolve();
        });
      });
    });

    it('should skip caching if no cacheable decorator', async () => {
      // Arrange
      reflector.get
        .mockReturnValueOnce(null) // cacheable
        .mockReturnValueOnce(null); // cacheInvalidate

      // Act
      await interceptor.intercept(executionContext, callHandler);

      // Assert
      expect(cacheService.get).not.toHaveBeenCalled();
      expect(callHandler.handle).toHaveBeenCalled();
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache before executing handler', async () => {
      // Arrange
      reflector.get
        .mockReturnValueOnce(null) // cacheable
        .mockReturnValueOnce({
          type: 'api',
          tags: ['products'],
        }); // cacheInvalidate

      // Act
      await interceptor.intercept(executionContext, callHandler);

      // Assert
      // The interceptor uses invalidateByTags if available
      expect(cacheService.invalidateByTags).toHaveBeenCalledWith(['products']);
      expect(callHandler.handle).toHaveBeenCalled();
    });

    it('should invalidate by key if no tags provided', async () => {
      // Arrange
      reflector.get
        .mockReturnValueOnce(null) // cacheable
        .mockReturnValueOnce({
          type: 'api',
          pattern: 'test-pattern',
        }); // cacheInvalidate

      // Act
      await interceptor.intercept(executionContext, callHandler);

      // Assert
      expect(cacheService.invalidate).toHaveBeenCalledWith('test-pattern', 'api');
    });
  });
});

