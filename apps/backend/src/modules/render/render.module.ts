import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RenderController } from './render.controller';
import { Render2DService } from './services/render-2d.service';
import { Render3DService } from './services/render-3d.service';
import { ExportService } from './services/export.service';
import { RenderWorker } from './workers/render.worker';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { S3Module } from '@/libs/s3/s3.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    S3Module,
    BullModule.registerQueue({
      name: 'render-2d',
    }),
    BullModule.registerQueue({
      name: 'render-3d',
    }),
    BullModule.registerQueue({
      name: 'export',
    }),
  ],
  controllers: [RenderController],
  providers: [
    Render2DService,
    Render3DService,
    ExportService,
    RenderWorker,
  ],
  exports: [
    Render2DService,
    Render3DService,
    ExportService,
  ],
})
export class RenderModule {}


