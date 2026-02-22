/**
 * Tests unitaires pour RetryService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RetryService } from '../retry.service';

describe('RetryService', () => {
  let service: RetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetryService],
    }).compile();

    service = module.get<RetryService>(RetryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await service.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('ECONNRESET');
          error.name = 'NetworkError';
          throw error;
        }
        return 'success';
      });

      const result = await service.execute(fn, {
        maxRetries: 3,
        initialDelayMs: 10, // Fast for tests
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const error = new Error('ECONNRESET');
      error.name = 'NetworkError';
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        service.execute(fn, {
          maxRetries: 2,
          initialDelayMs: 10,
        }),
      ).rejects.toThrow('ECONNRESET');

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const error = new Error('Invalid input');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(service.execute(fn)).rejects.toThrow('Invalid input');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('timeout');
        }
        return 'success';
      });

      const onRetry = jest.fn();

      await service.execute(fn, {
        maxRetries: 2,
        initialDelayMs: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalled();
    });
  });
});
