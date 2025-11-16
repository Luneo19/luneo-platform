import { RenderJobWorker } from '../render-job';
import { Job } from 'bullmq';
import OpenAI from 'openai';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('openai');
jest.mock('cloudinary');
jest.mock('ioredis');
jest.mock('../utils/storage');
jest.mock('../utils/logger');
jest.mock('../observability/span-helpers');

describe('RenderJobWorker', () => {
  let worker: RenderJobWorker;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock OpenAI
    mockOpenAI = {
      images: {
        edit: jest.fn(),
      },
    } as any;

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);

    // Create worker instance
    worker = new RenderJobWorker({
      host: 'localhost',
      port: 6379,
    });
  });

  afterEach(async () => {
    await worker.stop();
  });

  describe('processJob', () => {
    it('should process a render job successfully', async () => {
      const jobData = {
        designId: 'design-123',
        prompt: 'A beautiful landscape',
        baseTextureUrl: 'https://example.com/base.png',
        maskUrl: 'https://example.com/mask.png',
        tenantId: 'tenant-123',
        userId: 'user-123',
        renderOptions: {
          quality: 'standard' as const,
        },
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
        queueName: 'design-render',
        attemptsMade: 0,
      } as Job<typeof jobData>;

      // Mock OpenAI response
      mockOpenAI.images.edit.mockResolvedValue({
        data: [
          {
            url: 'https://example.com/generated.png',
          },
        ],
      } as any);

      // Mock download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      // Mock Prisma
      const mockPrisma = {
        design: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (worker as any).prisma = mockPrisma;

      // Mock Redis
      const mockRedis = {
        incr: jest.fn().mockResolvedValue(1),
        decr: jest.fn().mockResolvedValue(0),
        expire: jest.fn().mockResolvedValue(1),
        publish: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
      };
      (worker as any).redis = mockRedis;

      // Mock storage
      const { saveToStorage } = require('../utils/storage');
      saveToStorage.mockResolvedValue({
        url: 'https://storage.example.com/image.png',
        size: 1000,
      });

      // Execute
      const result = await (worker as any).processJob(mockJob);

      // Assertions
      expect(result.success).toBe(true);
      expect(result.compositeTextureUrl).toBeDefined();
      expect(result.previewUrl).toBeDefined();
      expect(result.highResUrl).toBeDefined();
      expect(result.costTokens).toBeGreaterThan(0);
      expect(mockPrisma.design.update).toHaveBeenCalled();
    });

    it('should reject blocked prompts', async () => {
      const jobData = {
        designId: 'design-123',
        prompt: 'sensitive information',
        baseTextureUrl: 'https://example.com/base.png',
        tenantId: 'tenant-123',
        renderOptions: {},
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
        queueName: 'design-render',
        attemptsMade: 0,
      } as Job<typeof jobData>;

      // Mock Prisma
      const mockPrisma = {
        design: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (worker as any).prisma = mockPrisma;

      // Mock Redis
      const mockRedis = {
        incr: jest.fn().mockResolvedValue(1),
        decr: jest.fn().mockResolvedValue(0),
        expire: jest.fn().mockResolvedValue(1),
        publish: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
      };
      (worker as any).redis = mockRedis;

      // Mock sanitizePrompt to return blocked
      const { sanitizePrompt } = require('@luneo/ai-safety');
      sanitizePrompt.mockReturnValue({
        blocked: true,
        prompt: '',
        redactions: [],
      });

      // Execute
      const result = await (worker as any).processJob(mockJob);

      // Assertions
      expect(result.success).toBe(false);
      expect(result.error).toContain('rejected');
    });

    it('should enforce token limits', async () => {
      const jobData = {
        designId: 'design-123',
        prompt: 'A beautiful landscape',
        baseTextureUrl: 'https://example.com/base.png',
        maskUrl: 'https://example.com/mask.png',
        tenantId: 'tenant-123',
        renderOptions: {},
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
        queueName: 'design-render',
        attemptsMade: 0,
      } as Job<typeof jobData>;

      // Mock OpenAI response
      mockOpenAI.images.edit.mockResolvedValue({
        data: [
          {
            url: 'https://example.com/generated.png',
          },
        ],
      } as any);

      // Mock download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      // Mock Prisma
      const mockPrisma = {
        design: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (worker as any).prisma = mockPrisma;

      // Mock Redis
      const mockRedis = {
        incr: jest.fn().mockResolvedValue(1),
        decr: jest.fn().mockResolvedValue(0),
        expire: jest.fn().mockResolvedValue(1),
        publish: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
      };
      (worker as any).redis = mockRedis;

      // Mock storage
      const { saveToStorage } = require('../utils/storage');
      saveToStorage.mockResolvedValue({
        url: 'https://storage.example.com/image.png',
        size: 1000,
      });

      // Set MAX_TOKENS_PER_JOB to a low value
      process.env.MAX_TOKENS_PER_JOB = '100';

      // Mock generateCompositeTexture to return high token count
      jest.spyOn(worker as any, 'generateCompositeTexture').mockResolvedValue({
        image: Buffer.from('test'),
        tokensUsed: 200, // Exceeds limit
        provider: 'openai',
      });

      // Execute
      const result = await (worker as any).processJob(mockJob);

      // Assertions
      expect(result.success).toBe(false);
      expect(result.error).toContain('Token limit exceeded');
    });

    it('should fallback to local diffusion when OpenAI fails', async () => {
      const jobData = {
        designId: 'design-123',
        prompt: 'A beautiful landscape',
        baseTextureUrl: 'https://example.com/base.png',
        maskUrl: 'https://example.com/mask.png',
        tenantId: 'tenant-123',
        renderOptions: {},
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
        queueName: 'design-render',
        attemptsMade: 0,
      } as Job<typeof jobData>;

      // Mock OpenAI to fail
      mockOpenAI.images.edit.mockRejectedValue(new Error('OpenAI API error'));

      // Mock local diffusion API
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('localhost:7860')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              image_url: 'https://example.com/local-generated.png',
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
        });
      });

      // Mock Prisma
      const mockPrisma = {
        design: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (worker as any).prisma = mockPrisma;

      // Mock Redis
      const mockRedis = {
        incr: jest.fn().mockResolvedValue(1),
        decr: jest.fn().mockResolvedValue(0),
        expire: jest.fn().mockResolvedValue(1),
        publish: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
      };
      (worker as any).redis = mockRedis;

      // Mock storage
      const { saveToStorage } = require('../utils/storage');
      saveToStorage.mockResolvedValue({
        url: 'https://storage.example.com/image.png',
        size: 1000,
      });

      // Execute
      const result = await (worker as any).processJob(mockJob);

      // Assertions
      expect(result.success).toBe(true);
      expect(result.metadata?.provider).toBe('local-diffusion');
    });
  });

  describe('circuit breaker', () => {
    it('should open circuit after threshold failures', async () => {
      const circuitBreaker = (worker as any).circuitBreaker;

      // Simulate failures
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error('API error')));
        } catch (error) {
          // Expected
        }
      }

      // Circuit should be open
      const state = circuitBreaker.getState();
      expect(state.state).toBe('open');

      // Next call should fail immediately
      await expect(
        circuitBreaker.execute(() => Promise.resolve('success')),
      ).rejects.toThrow('Circuit breaker is open');
    });
  });

  describe('tenant concurrency', () => {
    it('should enforce tenant concurrency limits', async () => {
      const concurrencyManager = (worker as any).concurrencyManager;
      const mockRedis = {
        incr: jest.fn().mockResolvedValue(3), // Already at limit
        expire: jest.fn().mockResolvedValue(1),
      };
      concurrencyManager.redis = mockRedis;

      await expect(concurrencyManager.acquireSlot('tenant-123', 2)).rejects.toThrow(
        'concurrency limit exceeded',
      );
    });
  });
});
