import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { GenerationProcessor } from './generation.processor';
import { PromptBuilderService } from './services/prompt-builder.service';
import { ImageProcessorService } from './services/image-processor.service';

// Providers IA
import { OpenAIProvider } from '@/libs/ai/providers/openai.provider';
import { ReplicateSDXLProvider } from '@/libs/ai/providers/replicate-sdxl.provider';
import { StabilityProvider } from './providers/stability.provider';
import { AIProviderFactory } from './providers/ai-provider.factory';

// Shared modules
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { ApiKeysModule } from '../public-api/api-keys/api-keys.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    ApiKeysModule,
    EventEmitterModule,
    BullModule.registerQueue({
      name: 'generation',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  controllers: [GenerationController],
  providers: [
    GenerationService,
    GenerationProcessor,
    PromptBuilderService,
    ImageProcessorService,
    OpenAIProvider,
    ReplicateSDXLProvider,
    StabilityProvider,
    AIProviderFactory,
  ],
  exports: [GenerationService],
})
export class GenerationModule {}



