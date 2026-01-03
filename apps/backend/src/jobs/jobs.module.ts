import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiGenerationWorker } from './worker';
import { DesignWorker } from './workers/design/design.worker';
import { RenderWorker } from './workers/render/render.worker';
import { ProductionWorker } from './workers/production/production.worker';
import { AIStudioWorker } from './workers/ai-studio/ai-studio.worker';
import { OutboxPublisherWorker } from '@/libs/outbox/outbox-publisher.worker';
import { OutboxScheduler } from './schedulers/outbox-scheduler';
import { RenderPreviewProcessor } from './workers/render/render-preview.processor';
import { RenderFinalProcessor } from './workers/render/render-final.processor';
import { ExportPackProcessor } from './workers/manufacturing/export-pack.processor';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { AiModule } from '@/modules/ai/ai.module';
import { ProductEngineModule } from '@/modules/product-engine/product-engine.module';
import { RenderModule } from '@/modules/render/render.module';
import { ManufacturingModule } from '@/modules/manufacturing/manufacturing.module';
import { OutboxModule } from '@/libs/outbox/outbox.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AIOrchestratorModule } from '@/libs/ai/ai-orchestrator.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    StorageModule,
    AiModule,
    ProductEngineModule,
    RenderModule,
    ManufacturingModule,
    OutboxModule,
    EventEmitterModule,
    ScheduleModule,
    AIOrchestratorModule,
    BullModule.registerQueue({
      name: 'ai-generation',
    }),
    BullModule.registerQueue({
      name: 'design-generation',
    }),
    BullModule.registerQueue({
      name: 'render-processing',
    }),
    BullModule.registerQueue({
      name: 'production-processing',
    }),
    BullModule.registerQueue({
      name: 'outbox-publisher',
    }),
    // NOUVEAU: Queues pour renders et exports
    BullModule.registerQueue({
      name: 'render-preview',
    }),
    BullModule.registerQueue({
      name: 'render-final',
    }),
    BullModule.registerQueue({
      name: 'export-manufacturing',
    }),
  ],
  providers: [
    AiGenerationWorker,
    AIStudioWorker,
    DesignWorker,
    RenderWorker,
    ProductionWorker,
    OutboxPublisherWorker,
    OutboxScheduler,
    // NOUVEAU: Processors pour renders et exports
    RenderPreviewProcessor,
    RenderFinalProcessor,
    ExportPackProcessor,
  ],
  exports: [BullModule],
})
export class JobsModule {}
