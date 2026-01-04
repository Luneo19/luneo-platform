import { Test, TestingModule } from '@nestjs/testing';
import { GenerationModule } from './generation.module';
import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';
import { GenerationProcessor } from './generation.processor';
import { PromptBuilderService } from './services/prompt-builder.service';
import { ImageProcessorService } from './services/image-processor.service';
import { AIProviderFactory } from './providers/ai-provider.factory';

describe('GenerationModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GenerationModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        product: { findFirst: jest.fn() },
        generation: { create: jest.fn() },
        brand: { update: jest.fn() },
      })
      .overrideProvider(StorageService)
      .useValue({
        uploadBuffer: jest.fn(),
      })
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have GenerationService', () => {
    const service = module.get<GenerationService>(GenerationService);
    expect(service).toBeDefined();
  });

  it('should have GenerationController', () => {
    const controller = module.get<GenerationController>(GenerationController);
    expect(controller).toBeDefined();
  });

  it('should have GenerationProcessor', () => {
    const processor = module.get<GenerationProcessor>(GenerationProcessor);
    expect(processor).toBeDefined();
  });

  it('should have PromptBuilderService', () => {
    const service = module.get<PromptBuilderService>(PromptBuilderService);
    expect(service).toBeDefined();
  });

  it('should have ImageProcessorService', () => {
    const service = module.get<ImageProcessorService>(ImageProcessorService);
    expect(service).toBeDefined();
  });

  it('should have AIProviderFactory', () => {
    const factory = module.get<AIProviderFactory>(AIProviderFactory);
    expect(factory).toBeDefined();
  });
});


