import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiGenerationWorker } from './worker';
import { DesignWorker } from './workers/design/design.worker';
import { RenderWorker } from './workers/render/render.worker';
import { ProductionWorker } from './workers/production/production.worker';
import { OutboxPublisherWorker } from '@/libs/outbox/outbox-publisher.worker';
import { OutboxScheduler } from './schedulers/outbox-scheduler';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { AiModule } from '@/modules/ai/ai.module';
import { ProductEngineModule } from '@/modules/product-engine/product-engine.module';
import { RenderModule } from '@/modules/render/render.module';
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
  ],
  providers: [
    AiGenerationWorker,
    DesignWorker,
    RenderWorker,
    ProductionWorker,
    OutboxPublisherWorker,
    OutboxScheduler,
  ],
  exports: [BullModule],
})
export class JobsModule {}
