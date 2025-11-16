import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiGenerationWorker } from './worker';
import { DesignWorker } from './workers/design/design.worker';
import { RenderWorker } from './workers/render/render.worker';
import { ProductionWorker } from './workers/production/production.worker';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { S3Module } from '@/libs/s3/s3.module';
import { AiModule } from '@/modules/ai/ai.module';
import { ProductEngineModule } from '@/modules/product-engine/product-engine.module';
import { RenderModule } from '@/modules/render/render.module';
import { QueueNames } from './queue.constants';
import { QueueHealthService } from './services/queue-health.service';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    S3Module,
    AiModule,
    ProductEngineModule,
    RenderModule,
    BullModule.registerQueue({
      name: QueueNames.AI_GENERATION,
    }),
    BullModule.registerQueue({
      name: QueueNames.IMAGE_GENERATION,
    }),
    BullModule.registerQueue({
      name: QueueNames.IMAGE_UPSCALE,
    }),
    BullModule.registerQueue({
      name: QueueNames.TEXTURE_BLEND,
    }),
    BullModule.registerQueue({
      name: QueueNames.EXPORT_GLTF,
    }),
    BullModule.registerQueue({
      name: QueueNames.AR_PREVIEW,
    }),
    BullModule.registerQueue({
      name: QueueNames.DESIGN_GENERATION,
    }),
    BullModule.registerQueue({
      name: QueueNames.RENDER_PROCESSING,
    }),
    BullModule.registerQueue({
      name: QueueNames.RENDER_2D,
    }),
    BullModule.registerQueue({
      name: QueueNames.RENDER_3D,
    }),
    BullModule.registerQueue({
      name: QueueNames.PRODUCTION_PROCESSING,
    }),
  ],
  providers: [
    AiGenerationWorker,
    DesignWorker,
    RenderWorker,
    ProductionWorker,
    QueueHealthService,
  ],
  exports: [BullModule, QueueHealthService],
})
export class JobsModule {}
