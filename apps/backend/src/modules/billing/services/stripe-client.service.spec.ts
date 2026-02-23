/**
 * StripeClientService Unit Tests
 * Tests for Stripe SDK initialization, lazy loading, and resilience patterns
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { StripeClientService } from './stripe-client.service';
import { CircuitBreakerService } from '@/libs/resilience/circuit-breaker.service';
import { RetryService } from '@/libs/resilience/retry.service';
import type Stripe from 'stripe';

describe('StripeClientService', () => {
  let service: StripeClientService;
  let _configService: jest.Mocked<ConfigService>;
  let _circuitBreakerService: jest.Mocked<CircuitBreakerService>;
  let _retryService: jest.Mocked<RetryService>;

  const mockStripeInstance = {
    prices: {
      retrieve: jest.fn(),
    },
  } as unknown as Stripe;

  const _mockStripeModule = {
    default: jest.fn().mockImplementation((_secretKey: string) => {
      return mockStripeInstance;
    }),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockCircuitBreakerService = {
    configure: jest.fn(),
    execute: jest.fn((serviceName: string, fn: () => Promise<unknown>) => fn()),
    getStatus: jest.fn(() => ({
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      openedAt: null,
    })),
  };

  const mockRetryService = {
    execute: jest.fn((operation: () => Promise<unknown>) => operation()),
    isRetryableStripeError: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset config service mock
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, unknown> = {
        'app.nodeEnv': 'test',
        'stripe.secretKey': 'sk_test_xxx',
        'stripe.priceProMonthly': 'price_pro_monthly',
        'stripe.priceProYearly': 'price_pro_yearly',
        'stripe.priceBusinessMonthly': 'price_business_monthly',
        'stripe.priceBusinessYearly': 'price_business_yearly',
        'stripe.priceEnterpriseMonthly': 'price_enterprise_monthly',
        'stripe.priceEnterpriseYearly': 'price_enterprise_yearly',
      };
      return config[key];
    });

    // Reset circuit breaker mock
    mockCircuitBreakerService.execute.mockImplementation(
      (serviceName: string, fn: () => Promise<unknown>) => fn(),
    );
    mockCircuitBreakerService.getStatus.mockReturnValue({
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      openedAt: null,
    });

    // Reset retry service mock
    mockRetryService.execute.mockImplementation((operation: () => Promise<unknown>) => operation());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeClientService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CircuitBreakerService, useValue: mockCircuitBreakerService },
        { provide: RetryService, useValue: mockRetryService },
      ],
    }).compile();

    service = module.get<StripeClientService>(StripeClientService);
    configService = module.get(ConfigService);
    circuitBreakerService = module.get(CircuitBreakerService);
    retryService = module.get(RetryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should configure circuit breaker for stripe-api service', () => {
      expect(mockCircuitBreakerService.configure).toHaveBeenCalledWith(
        'stripe-api',
        expect.objectContaining({
          failureThreshold: 5,
          recoveryTimeout: 30000,
          monitoringWindow: 60000,
          halfOpenMaxCalls: 3,
        }),
      );
    });
  });

  describe('getStripe', () => {
    beforeEach(() => {
      // Reset internal state before each test
      (service as unknown).stripeInstance = null;
      (service as unknown).stripeModule = null;
    });

    it('should throw InternalServerErrorException when secret key is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.getStripe()).rejects.toThrow(InternalServerErrorException);
      await expect(service.getStripe()).rejects.toThrow('STRIPE_SECRET_KEY is not configured');
      expect(mockConfigService.get).toHaveBeenCalledWith('stripe.secretKey');
    });

    it('should return Stripe instance when secret key is configured', async () => {
      mockConfigService.get.mockReturnValue('sk_test_xxx');

      // Mock the Stripe module and constructor
      const mockStripeConstructor = jest.fn().mockReturnValue(mockStripeInstance);
      (service as unknown).stripeModule = {
        default: mockStripeConstructor,
      };

      const result = await service.getStripe();

      expect(result).toBeDefined();
      expect(result).toBe(mockStripeInstance);
      expect(mockConfigService.get).toHaveBeenCalledWith('stripe.secretKey');
      expect(mockStripeConstructor).toHaveBeenCalledWith('sk_test_xxx', {
        apiVersion: '2023-10-16',
      });
    });

    it('should return same instance on subsequent calls (singleton)', async () => {
      mockConfigService.get.mockReturnValue('sk_test_xxx');

      const mockStripe = mockStripeInstance;
      (service as unknown).stripeInstance = mockStripe;

      const instance1 = await service.getStripe();
      const instance2 = await service.getStripe();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(mockStripe);
      // Config should not be checked again if instance is already cached
      expect(mockConfigService.get).not.toHaveBeenCalled();
    });

    it('should lazy load Stripe module only once', async () => {
      mockConfigService.get.mockReturnValue('sk_test_xxx');

      const mockStripeConstructor = jest.fn().mockReturnValue(mockStripeInstance);
      const mockModule = { default: mockStripeConstructor };

      // Simulate first call - module needs to be loaded
      (service as unknown).stripeModule = null;
      (service as unknown).stripeInstance = null;

      // Set up module before first call
      (service as unknown).stripeModule = mockModule;
      const result1 = await service.getStripe();

      // Second call should use cached instance
      const result2 = await service.getStripe();

      expect(result1).toBe(result2);
      expect(mockStripeConstructor).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCircuitStatus', () => {
    it('should delegate to circuit breaker service', () => {
      const mockStatus = {
        state: 'CLOSED',
        failures: 0,
        successes: 5,
        lastFailure: null as Date | null,
        lastSuccess: new Date() as Date | null,
        openedAt: null as Date | null,
      };

      mockCircuitBreakerService.getStatus.mockReturnValue(mockStatus);

      const result = service.getCircuitStatus();

      expect(mockCircuitBreakerService.getStatus).toHaveBeenCalledWith('stripe-api');
      expect(result).toEqual(mockStatus);
    });

    it('should return circuit status with different states', () => {
      const openStatus = {
        state: 'OPEN',
        failures: 5,
        successes: 0,
        lastFailure: new Date() as Date | null,
        lastSuccess: null as Date | null,
        openedAt: new Date() as Date | null,
      };

      mockCircuitBreakerService.getStatus.mockReturnValue(openStatus);

      const result = service.getCircuitStatus();

      expect(result.state).toBe('OPEN');
      expect(result.failures).toBe(5);
    });
  });

  describe('executeWithResilience', () => {
    it('should execute operation with retry and circuit breaker', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const operationName = 'test-operation';

      mockRetryService.execute.mockImplementation(async (operation) => {
        return operation();
      });
      mockCircuitBreakerService.execute.mockImplementation(async (serviceName, fn) => {
        return fn();
      });

      const result = await service.executeWithResilience(mockOperation, operationName);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockRetryService.execute).toHaveBeenCalledWith(
        mockOperation,
        expect.objectContaining({
          maxAttempts: 3,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
          exponentialBackoff: true,
          retryableErrors: RetryService.isRetryableStripeError,
        }),
        operationName,
      );
      expect(mockCircuitBreakerService.execute).toHaveBeenCalledWith(
        'stripe-api',
        expect.any(Function),
        undefined,
      );
    });

    it('should use custom maxRetries when provided', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const operationName = 'test-operation';

      mockRetryService.execute.mockImplementation(async (operation) => {
        return operation();
      });

      await service.executeWithResilience(mockOperation, operationName, { maxRetries: 5 });

      expect(mockRetryService.execute).toHaveBeenCalledWith(
        mockOperation,
        expect.objectContaining({
          maxAttempts: 5,
        }),
        operationName,
      );
    });

    it('should skip circuit breaker when skipCircuitBreaker is true', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const operationName = 'test-operation';

      mockRetryService.execute.mockImplementation(async (operation) => {
        return operation();
      });

      const result = await service.executeWithResilience(mockOperation, operationName, {
        skipCircuitBreaker: true,
      });

      expect(result).toBe('success');
      expect(mockRetryService.execute).toHaveBeenCalled();
      expect(mockCircuitBreakerService.execute).not.toHaveBeenCalled();
    });

    it('should propagate errors from operation', async () => {
      const mockError = new Error('Operation failed');
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      const operationName = 'test-operation';

      mockRetryService.execute.mockImplementation(async (operation) => {
        return operation();
      });
      mockCircuitBreakerService.execute.mockImplementation(async (serviceName, fn) => {
        return fn();
      });

      await expect(
        service.executeWithResilience(mockOperation, operationName),
      ).rejects.toThrow('Operation failed');
    });

    it('should handle circuit breaker rejection', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const circuitError = new Error('Circuit breaker is open');

      mockRetryService.execute.mockImplementation(async (operation) => {
        return operation();
      });
      mockCircuitBreakerService.execute.mockRejectedValue(circuitError);

      await expect(
        service.executeWithResilience(mockOperation, 'test-operation'),
      ).rejects.toThrow('Circuit breaker is open');
    });
  });

  describe('onModuleInit', () => {
    it('should validate Stripe configuration successfully in non-production mode', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'app.nodeEnv': 'development',
          'stripe.secretKey': 'sk_test_xxx',
          'stripe.priceProMonthly': 'price_pro_monthly',
          'stripe.priceProYearly': 'price_pro_yearly',
          'stripe.priceBusinessMonthly': 'price_business_monthly',
          'stripe.priceBusinessYearly': 'price_business_yearly',
          'stripe.priceEnterpriseMonthly': 'price_enterprise_monthly',
          'stripe.priceEnterpriseYearly': 'price_enterprise_yearly',
        };
        return config[key];
      });

      await service.onModuleInit();

      expect(service.stripeConfigValid).toBe(true);
    });

    it('should handle missing secret key in development mode', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'development';
        if (key === 'stripe.secretKey') return undefined;
        return 'some-value';
      });

      await service.onModuleInit();

      expect(service.stripeConfigValid).toBe(false);
    });

    it('should handle missing secret key in production gracefully (degrades instead of throwing)', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'production';
        if (key === 'stripe.secretKey') return undefined;
        return 'some-value';
      });

      await service.onModuleInit();

      expect(service.stripeConfigValid).toBe(false);
    });

    it('should handle missing price IDs in development mode', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'development';
        if (key === 'stripe.secretKey') return 'sk_test_xxx';
        if (key.startsWith('stripe.price')) return undefined;
        return 'some-value';
      });

      await service.onModuleInit();

      expect(service.stripeConfigValid).toBe(true);
    });

    it('should handle missing price IDs in production gracefully (degrades instead of throwing)', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'production';
        if (key === 'stripe.secretKey') return 'sk_test_xxx';
        if (key.startsWith('stripe.price')) return undefined;
        return 'some-value';
      });

      await service.onModuleInit();

      expect(service.stripeConfigValid).toBe(false);
    });

    it('should validate price IDs in production mode', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'app.nodeEnv': 'production',
          'stripe.secretKey': 'sk_test_xxx',
          'stripe.priceProMonthly': 'price_pro_monthly',
          'stripe.priceProYearly': 'price_pro_yearly',
          'stripe.priceBusinessMonthly': 'price_business_monthly',
          'stripe.priceBusinessYearly': 'price_business_yearly',
          'stripe.priceEnterpriseMonthly': 'price_enterprise_monthly',
          'stripe.priceEnterpriseYearly': 'price_enterprise_yearly',
        };
        return config[key];
      });

      // Mock getStripe to return a mock Stripe instance
      const mockStripe = {
        prices: {
          retrieve: jest.fn().mockResolvedValue({
            id: 'price_pro_monthly',
            active: true,
          }),
        },
      };

      jest.spyOn(service, 'getStripe').mockResolvedValue(mockStripe as unknown as Stripe);

      await service.onModuleInit();

      expect(service.stripeConfigValid).toBe(true);
      expect(mockStripe.prices.retrieve).toHaveBeenCalled();
    });

    it('should handle Stripe API errors during validation gracefully', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'app.nodeEnv': 'production',
          'stripe.secretKey': 'sk_test_xxx',
          'stripe.priceProMonthly': 'price_pro_monthly',
          'stripe.priceProYearly': 'price_pro_yearly',
          'stripe.priceBusinessMonthly': 'price_business_monthly',
          'stripe.priceBusinessYearly': 'price_business_yearly',
          'stripe.priceEnterpriseMonthly': 'price_enterprise_monthly',
          'stripe.priceEnterpriseYearly': 'price_enterprise_yearly',
        };
        return config[key];
      });

      const mockStripe = {
        prices: {
          retrieve: jest.fn().mockRejectedValue(new Error('Stripe API error')),
        },
      };

      jest.spyOn(service, 'getStripe').mockResolvedValue(mockStripe as unknown as Stripe);

      await service.onModuleInit();

      expect(service.stripeConfigValid).toBe(false);
    });

    it('should handle invalid price IDs in production mode', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'app.nodeEnv': 'production',
          'stripe.secretKey': 'sk_test_xxx',
          'stripe.priceProMonthly': 'price_pro_monthly',
          'stripe.priceProYearly': 'price_pro_yearly',
          'stripe.priceBusinessMonthly': 'price_business_monthly',
          'stripe.priceBusinessYearly': 'price_business_yearly',
          'stripe.priceEnterpriseMonthly': 'price_enterprise_monthly',
          'stripe.priceEnterpriseYearly': 'price_enterprise_yearly',
        };
        return config[key];
      });

      const mockStripe = {
        prices: {
          retrieve: jest.fn().mockImplementation((priceId: string) => {
            if (priceId === 'price_pro_monthly') {
              return Promise.reject(new Error('Invalid price ID'));
            }
            return Promise.resolve({
              id: priceId,
              active: true,
            });
          }),
        },
      };

      jest.spyOn(service, 'getStripe').mockResolvedValue(mockStripe as unknown as Stripe);

      await service.onModuleInit();

      expect(service.stripeConfigValid).toBe(false);
    });

    it('should handle inactive price IDs with warning', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'app.nodeEnv': 'production',
          'stripe.secretKey': 'sk_test_xxx',
          'stripe.priceProMonthly': 'price_pro_monthly',
          'stripe.priceProYearly': 'price_pro_yearly',
          'stripe.priceBusinessMonthly': 'price_business_monthly',
          'stripe.priceBusinessYearly': 'price_business_yearly',
          'stripe.priceEnterpriseMonthly': 'price_enterprise_monthly',
          'stripe.priceEnterpriseYearly': 'price_enterprise_yearly',
        };
        return config[key];
      });

      const mockStripe = {
        prices: {
          retrieve: jest.fn().mockResolvedValue({
            id: 'price_pro_monthly',
            active: false,
          }),
        },
      };

      jest.spyOn(service, 'getStripe').mockResolvedValue(mockStripe as unknown as Stripe);

      await service.onModuleInit();

      // Should still validate but with warning
      expect(mockStripe.prices.retrieve).toHaveBeenCalled();
    });

    it('should handle general configuration errors gracefully', async () => {
      // Throw only when accessing stripe config (inside try block) so the error is caught
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'production';
        if (key === 'stripe.secretKey') throw new Error('Config error');
        return undefined;
      });

      await service.onModuleInit();

      expect(service.stripeConfigValid).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return stripeConfigValid status', () => {
      (service as unknown)._stripeConfigValid = true;
      expect(service.stripeConfigValid).toBe(true);

      (service as unknown)._stripeConfigValid = false;
      expect(service.stripeConfigValid).toBe(false);
    });

    it('should return validatedPriceIds', () => {
      const mockPriceIds = {
        pro: { monthly: 'price_1', yearly: 'price_2' },
        
        business: { monthly: 'price_5', yearly: 'price_6' },
        enterprise: { monthly: 'price_7', yearly: 'price_8' },
      };

      (service as unknown)._validatedPriceIds = mockPriceIds;
      expect(service.validatedPriceIds).toEqual(mockPriceIds);

      (service as unknown)._validatedPriceIds = null;
      expect(service.validatedPriceIds).toBeNull();
    });
  });
});
