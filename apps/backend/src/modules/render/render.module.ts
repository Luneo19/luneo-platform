import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    StorageModule,
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
  ],
  controllers: [RenderController],
  providers: [
    Render2DService,
    Render3DService,
    ExportService,
    RenderWorker,
    CADIntegrationService,
  ],
  exports: [
    Render2DService,
    Render3DService,
    ExportService,
    CADIntegrationService,
  ],
})
export class RenderModule {}


