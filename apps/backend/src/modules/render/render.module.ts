import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { RenderController } from './render.controller';
import { Render2DService } from './services/render-2d.service';
import { Render3DService } from './services/render-3d.service';
import { ExportService } from './services/export.service';
import { RenderWorker } from './workers/render.worker';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { CADValidationModule } from '@/libs/cad/cad-validation.module';
import { LODModule } from '@/libs/3d/lod.module';
import { MarketingRenderModule } from '@/libs/3d/marketing-render.module';
import { VariantModule } from '@/libs/3d/variant.module';
import { CADIntegrationService } from './services/cad-integration.service';
import { RenderQueueService } from './services/render-queue.service';
import { RenderStatusService } from './services/render-status.service';
import { RenderPrintReadyService } from './services/render-print-ready.service';
import { PrintReadyWorker } from './workers/print-ready.worker';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SmartCacheModule,
    StorageModule,
    UsageBillingModule,
    CADValidationModule,
    LODModule,
    MarketingRenderModule,
    VariantModule,
    BullModule.registerQueue({
      name: 'render-2d',
    }),
    BullModule.registerQueue({
      name: 'render-3d',
    }),
    BullModule.registerQueue({
      name: 'export',
    }),
    // NOUVEAU: Queues pour preview et final renders
    // Note: Utiliser BullModule existant (compatible avec BullMQ configuré dans app.module.ts)
    BullModule.registerQueue({
      name: 'render-preview',
    }),
    BullModule.registerQueue({
      name: 'render-final',
    }),
    BullModule.registerQueue({
      name: 'render-print-ready',
    }),
  ],
  controllers: [RenderController],
  providers: [
    Render2DService,
    Render3DService,
    ExportService,
    RenderWorker,
    CADIntegrationService,
    // NOUVEAU: Services pour queue et status
    RenderQueueService,
    RenderStatusService,
    RenderPrintReadyService,
    // Workers
    PrintReadyWorker,
  ],
  exports: [
    Render2DService,
    Render3DService,
    ExportService,
    CADIntegrationService,
    RenderQueueService,
    RenderStatusService,
  ],
})
export class RenderModule {}


