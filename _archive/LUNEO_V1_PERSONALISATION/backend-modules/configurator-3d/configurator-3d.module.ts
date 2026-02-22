import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import {
  Configurator3DController,
  Configurator3DComponentsController,
  Configurator3DOptionsController,
  Configurator3DSessionsController,
  Configurator3DRulesController,
  Configurator3DPricingController,
  Configurator3DExportController,
  Configurator3DAnalyticsController,
} from './controllers';
import { Configurator3DService } from './services/configurator-3d.service';
import { Configurator3DComponentsService } from './services/configurator-3d-components.service';
import { Configurator3DOptionsService } from './services/configurator-3d-options.service';
import { Configurator3DSessionService } from './services/configurator-3d-session.service';
import { Configurator3DRulesService } from './services/configurator-3d-rules.service';
import { Configurator3DPricingService } from './services/configurator-3d-pricing.service';
import { Configurator3DValidationService } from './services/configurator-3d-validation.service';
import { Configurator3DExportService } from './services/configurator-3d-export.service';
import { ConfiguratorEnhancedService } from './services/configurator-enhanced.service';
import { Configurator3DCacheService } from './services/configurator-3d-cache.service';
import { Configurator3DAnalyticsService } from './services/configurator-3d-analytics.service';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { ConfiguratorOwnerGuard } from './guards/configurator-owner.guard';
import { ConfiguratorAccessGuard } from './guards/configurator-access.guard';
import { SessionOwnerGuard } from './guards/session-owner.guard';
import {
  ConfiguratorCacheInterceptor,
  ConfiguratorLoggingInterceptor,
  SessionTrackingInterceptor,
} from './interceptors';
import {
  ExportPdfWorker,
  Export3DWorker,
  AnalyticsAggregationWorker,
  CacheWarmupWorker,
} from './workers';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    StorageModule,
    BullModule.registerQueue(
      { name: 'configurator-3d-export-pdf' },
      { name: 'configurator-3d-export-3d' },
      { name: 'configurator-export' },
      { name: 'configurator-3d-analytics' },
      { name: 'configurator-3d-cache' },
    ),
  ],
  controllers: [
    Configurator3DController,
    Configurator3DComponentsController,
    Configurator3DOptionsController,
    Configurator3DSessionsController,
    Configurator3DRulesController,
    Configurator3DPricingController,
    Configurator3DExportController,
    Configurator3DAnalyticsController,
  ],
  providers: [
    Configurator3DService,
    Configurator3DComponentsService,
    Configurator3DOptionsService,
    Configurator3DSessionService,
    Configurator3DRulesService,
    Configurator3DPricingService,
    Configurator3DValidationService,
    Configurator3DExportService,
    ConfiguratorEnhancedService,
    Configurator3DCacheService,
    Configurator3DAnalyticsService,
    ExportPdfWorker,
    Export3DWorker,
    AnalyticsAggregationWorker,
    CacheWarmupWorker,
    OptionalJwtAuthGuard,
    ConfiguratorOwnerGuard,
    ConfiguratorAccessGuard,
    SessionOwnerGuard,
    ConfiguratorCacheInterceptor,
    ConfiguratorLoggingInterceptor,
    SessionTrackingInterceptor,
  ],
  exports: [
    Configurator3DService,
    Configurator3DComponentsService,
    Configurator3DOptionsService,
    Configurator3DSessionService,
    Configurator3DRulesService,
    Configurator3DPricingService,
    Configurator3DValidationService,
    Configurator3DExportService,
    ConfiguratorEnhancedService,
    Configurator3DCacheService,
    Configurator3DAnalyticsService,
  ],
})
export class Configurator3DModule {}
