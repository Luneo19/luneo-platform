/**
 * GenerationModule - Tests unitaires
 * Tests que le module est correctement configuré avec tous ses providers
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';
import { GenerationProcessor } from './generation.processor';
import { PromptBuilderService } from './services/prompt-builder.service';
import { PromptSecurityService } from '@/modules/agents/services/prompt-security.service';
import { ImageProcessorService } from './services/image-processor.service';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { OpenAIProvider } from '@/libs/ai/providers/openai.provider';
import { ReplicateSDXLProvider } from '@/libs/ai/providers/replicate-sdxl.provider';
import { StabilityProvider } from './providers/stability.provider';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { ApiKeysService } from '../public-api/api-keys/api-keys.service';
import { HttpService } from '@nestjs/axios';
import { QuotasService } from '@/modules/usage-billing/services/quotas.service';
import { UsageTrackingService } from '@/modules/usage-billing/services/usage-tracking.service';

// ============================================================================
// MOCKS
// ============================================================================

const mockPrismaService: Record<string, any> = {
  product: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
  design: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  brand: { update: jest.fn(), findUnique: jest.fn() },
  apiKey: { findFirst: jest.fn() },
  $transaction: jest.fn((fn: any): Promise<any> => {
    if (Array.isArray(fn)) return Promise.all(fn);
    return fn(mockPrismaService);
  }),
};

const mockStorageService = {
  uploadBuffer: jest.fn(),
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getSignedUrl: jest.fn(),
};

const mockConfigService: Record<string, any> = {
  get: jest.fn((key: string) => {
    const config: Record<string, string | number> = {
      'OPENAI_API_KEY': 'test-openai-key',
      'REPLICATE_API_KEY': 'test-replicate-key',
      'STABILITY_API_KEY': 'test-stability-key',
      'CLOUDINARY_CLOUD_NAME': 'test-cloud',
      'CLOUDINARY_API_KEY': 'test-key',
      'CLOUDINARY_API_SECRET': 'test-secret',
      'REDIS_URL': 'redis://localhost:6380',
    };
    return config[key] || undefined;
  }),
  getOrThrow: jest.fn((key: string): string | number => {
    const value = mockConfigService.get(key);
    if (!value) throw new Error(`Config ${key} not found`);
    return value;
  }),
};

const mockQueue = {
  add: jest.fn(),
  process: jest.fn(),
  on: jest.fn(),
  getJob: jest.fn(),
};

const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
};

const mockApiKeysService = {
  validateApiKey: jest.fn(),
  findByKey: jest.fn(),
};

const mockHttpService = {
  post: jest.fn(),
  get: jest.fn(),
  axiosRef: { post: jest.fn(), get: jest.fn() },
};

// ============================================================================
// TESTS
// ============================================================================

describe('GenerationModule', () => {
  let module: TestingModule;
  let generationService: GenerationService;
  let generationController: GenerationController;
  let promptBuilderService: PromptBuilderService;
  let imageProcessorService: ImageProcessorService;
  let aiProviderFactory: AIProviderFactory;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [GenerationController],
      providers: [
        GenerationService,
        GenerationProcessor,
        PromptBuilderService,
        { provide: PromptSecurityService, useValue: { validatePrompt: jest.fn().mockResolvedValue({ safe: true, sanitized: '' }), sanitizePrompt: jest.fn().mockImplementation((p: string) => p), validateAndSanitize: jest.fn().mockImplementation((p: string) => p) } },
        ImageProcessorService,
        AIProviderFactory,
        OpenAIProvider,
        ReplicateSDXLProvider,
        StabilityProvider,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getQueueToken('generation'), useValue: mockQueue },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: ApiKeysService, useValue: mockApiKeysService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: QuotasService, useValue: { enforceQuota: jest.fn().mockResolvedValue(undefined) } },
        { provide: UsageTrackingService, useValue: { track: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    generationService = module.get<GenerationService>(GenerationService);
    generationController = module.get<GenerationController>(GenerationController);
    promptBuilderService = module.get<PromptBuilderService>(PromptBuilderService);
    imageProcessorService = module.get<ImageProcessorService>(ImageProcessorService);
    aiProviderFactory = module.get<AIProviderFactory>(AIProviderFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have GenerationService', () => {
    expect(generationService).toBeDefined();
    expect(generationService).toBeInstanceOf(GenerationService);
  });

  it('should have GenerationController', () => {
    expect(generationController).toBeDefined();
    expect(generationController).toBeInstanceOf(GenerationController);
  });

  it('should have GenerationProcessor', () => {
    const processor = module.get<GenerationProcessor>(GenerationProcessor);
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(GenerationProcessor);
  });

  it('should have PromptBuilderService', () => {
    expect(promptBuilderService).toBeDefined();
    expect(promptBuilderService).toBeInstanceOf(PromptBuilderService);
  });

  it('should have ImageProcessorService', () => {
    expect(imageProcessorService).toBeDefined();
    expect(imageProcessorService).toBeInstanceOf(ImageProcessorService);
  });

  it('should have AIProviderFactory', () => {
    expect(aiProviderFactory).toBeDefined();
    expect(aiProviderFactory).toBeInstanceOf(AIProviderFactory);
  });

  describe('AI Providers', () => {
    it('should have OpenAIProvider', () => {
      const provider = module.get<OpenAIProvider>(OpenAIProvider);
      expect(provider).toBeDefined();
    });

    it('should have ReplicateSDXLProvider', () => {
      const provider = module.get<ReplicateSDXLProvider>(ReplicateSDXLProvider);
      expect(provider).toBeDefined();
    });

    it('should have StabilityProvider', () => {
      const provider = module.get<StabilityProvider>(StabilityProvider);
      expect(provider).toBeDefined();
    });
  });
});
