import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RenderController } from './render.controller';
import { Render2DService } from './services/render-2d.service';
import { Render3DService } from './services/render-3d.service';
import { ExportService } from './services/export.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { S3Module } from '@/libs/s3/s3.module';
import { RenderQueueService } from './services/render-queue.service';
import { RenderJobQueueService } from './services/render-job-queue.service';
import { QueueNames } from '@/jobs/queue.constants';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { QuotaGuard } from '@/common/guards/quota.guard';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    S3Module,
    UsageBillingModule,
    BullModule.registerQueue({
      name: QueueNames.RENDER_PROCESSING,
    }),
    BullModule.registerQueue({
      name: QueueNames.RENDER_2D,
    }),
    BullModule.registerQueue({
      name: QueueNames.RENDER_3D,
    }),
  ],
  controllers: [RenderController],
  providers: [
    Render2DService,
    Render3DService,
    ExportService,
    RenderJobQueueService,
    RenderQueueService,
    QuotaGuard,
  ],
  exports: [
    Render2DService,
    Render3DService,
    ExportService,
    RenderJobQueueService,
    RenderQueueService,
  ],
})
export class RenderModule {}


