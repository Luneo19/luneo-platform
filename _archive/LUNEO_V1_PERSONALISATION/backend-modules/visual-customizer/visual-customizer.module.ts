import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { CUSTOMIZER_QUEUES } from './visual-customizer.constants';

// Controllers
import { VisualCustomizerController } from './controllers/visual-customizer.controller';
import { CustomizerZonesController } from './controllers/customizer-zones.controller';
import { CustomizerLayersController } from './controllers/customizer-layers.controller';
import { CustomizerPresetsController } from './controllers/customizer-presets.controller';
import { CustomizerAssetsController } from './controllers/customizer-assets.controller';
import { CustomizerSessionsController } from './controllers/customizer-sessions.controller';
import { CustomizerExportController } from './controllers/customizer-export.controller';
import { CustomizerModerationController } from './controllers/customizer-moderation.controller';
import { CustomizerAnalyticsController } from './controllers/customizer-analytics.controller';

// Services
import { VisualCustomizerService } from './services/visual-customizer.service';
import { CustomizerZonesService } from './services/customizer-zones.service';
import { CustomizerLayersService } from './services/customizer-layers.service';
import { CustomizerPresetsService } from './services/customizer-presets.service';
import { CustomizerAssetsService } from './services/customizer-assets.service';
import { CustomizerTextsService } from './services/customizer-texts.service';
import { CustomizerSessionsService } from './services/customizer-sessions.service';
import { CustomizerValidationService } from './services/customizer-validation.service';
import { ConstraintEngineService } from './services/constraint-engine.service';
import { CustomizerRenderService } from './services/customizer-render.service';
import { CustomizerExportService } from './services/customizer-export.service';
import { CustomizerCacheService } from './services/customizer-cache.service';
import { CustomizationSyncService } from './services/customization-sync.service';
import { CustomizationOrderService } from './services/customization-order.service';
import { CustomizerModerationService } from './services/customizer-moderation.service';
import { CustomizerAnalyticsService } from './services/customizer-analytics.service';
import { ZoneEngineService } from './services/zone-engine.service';
import { ZonePricingService } from './services/zone-pricing.service';
import { CustomizerWebhookEmitter } from './events/webhook-emitter.service';

// Guards
import { CustomizerOwnerGuard } from './guards/customizer-owner.guard';
import { CustomizerAccessGuard } from './guards/customizer-access.guard';
import { SessionOwnerGuard } from './guards/session-owner.guard';
import { AssetAccessGuard } from './guards/asset-access.guard';

// Pipes
import { CanvasDataValidationPipe } from './pipes/canvas-data-validation.pipe';
import { TextSanitizationPipe } from './pipes/text-sanitization.pipe';
import { ImageValidationPipe } from './pipes/image-validation.pipe';

// Workers (@nestjs/bull)
import { RenderWorker } from './workers/render.worker';
import { ExportWorker } from './workers/export.worker';
import { ModerationWorker } from './workers/moderation.worker';
import { ThumbnailWorker } from './workers/thumbnail.worker';
import { AnalyticsWorker } from './workers/analytics.worker';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    StorageModule,
    BullModule.registerQueue({
      name: CUSTOMIZER_QUEUES.RENDER,
    }),
    BullModule.registerQueue({
      name: CUSTOMIZER_QUEUES.EXPORT,
    }),
    BullModule.registerQueue({
      name: CUSTOMIZER_QUEUES.MODERATION,
    }),
    BullModule.registerQueue({
      name: CUSTOMIZER_QUEUES.THUMBNAIL,
    }),
    BullModule.registerQueue({
      name: CUSTOMIZER_QUEUES.ANALYTICS,
    }),
  ],
  controllers: [
    VisualCustomizerController,
    CustomizerZonesController,
    CustomizerLayersController,
    CustomizerPresetsController,
    CustomizerAssetsController,
    CustomizerSessionsController,
    CustomizerExportController,
    CustomizerModerationController,
    CustomizerAnalyticsController,
  ],
  providers: [
    // Services
    VisualCustomizerService,
    CustomizerZonesService,
    CustomizerLayersService,
    CustomizerPresetsService,
    CustomizerAssetsService,
    CustomizerTextsService,
    CustomizerSessionsService,
    CustomizerValidationService,
    ConstraintEngineService,
    CustomizerRenderService,
    CustomizerExportService,
    CustomizerCacheService,
    CustomizationSyncService,
    CustomizationOrderService,
    CustomizerModerationService,
    CustomizerAnalyticsService,
    ZonePricingService,
    ZoneEngineService,
    CustomizerWebhookEmitter,
    // Guards
    CustomizerOwnerGuard,
    CustomizerAccessGuard,
    SessionOwnerGuard,
    AssetAccessGuard,
    // Pipes
    CanvasDataValidationPipe,
    TextSanitizationPipe,
    ImageValidationPipe,
    // Workers
    RenderWorker,
    ExportWorker,
    ModerationWorker,
    ThumbnailWorker,
    AnalyticsWorker,
  ],
  exports: [
    VisualCustomizerService,
    CustomizerSessionsService,
  ],
})
export class VisualCustomizerModule {}
