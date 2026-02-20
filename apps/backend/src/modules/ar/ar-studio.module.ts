/**
 * ★★★ MODULE - AR STUDIO ★★★
 * Module NestJS pour AR Studio
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { ArStudioController } from './ar-studio.controller';
import { ArStudioService } from './ar-studio.service';
import { ArIntegrationsController } from './controllers/ar-integrations.controller';
import { ArCollaborationController } from './controllers/ar-collaboration.controller';
import { ArProjectsController } from './controllers/ar-projects.controller';
import { ArViewerController } from './controllers/ar-viewer.controller';
import { ArModelsController } from './controllers/ar-models.controller';
import { ArTargetsController } from './controllers/ar-targets.controller';
import { ArQrCodesController } from './controllers/ar-qr-codes.controller';
import { ArAnalyticsController } from './controllers/ar-analytics.controller';
import { ArEcommerceController } from './controllers/ar-ecommerce.controller';
import { ARRoomsController } from './controllers/ar-rooms.controller';
import { ArIntegrationsService } from './services/ar-integrations.service';
import { ArCollaborationService } from './services/ar-collaboration.service';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { PlatformDetectorService } from './platforms/platform-detector.service';
import { ARQuickLookService } from './platforms/ios/ar-quick-look.service';
import { UsdzGeneratorService } from './platforms/ios/usdz-generator.service';
import { SceneViewerService } from './platforms/android/scene-viewer.service';
import { WebxrConfigService } from './platforms/web/webxr-config.service';
import { ModelViewerConfigService } from './platforms/web/model-viewer-config.service';
import { QRCodeRedirectService } from './platforms/desktop/qr-code-redirect.service';
import { TargetQualityAnalyzerService } from './tracking/target-quality-analyzer.service';
import { FeatureExtractorService } from './tracking/feature-extractor.service';
import { TargetManagerService } from './tracking/target-manager.service';
import { ImageTargetService } from './tracking/image-target.service';
import { QrGeneratorService } from './qr-codes/qr-generator.service';
import { QrCustomizerService } from './qr-codes/qr-customizer.service';
import { QrAnalyticsService } from './qr-codes/qr-analytics.service';
import { DynamicLinkService } from './qr-codes/dynamic-link.service';
import { ArAnalyticsService } from './analytics/ar-analytics.service';
import { SessionTrackerService } from './analytics/session-tracker.service';
import { EngagementCalculatorService } from './analytics/engagement-calculator.service';
import { ConversionTrackerService } from './analytics/conversion-tracker.service';
import { HeatmapGeneratorService } from './analytics/heatmap-generator.service';
import { ModelConverterService } from './conversion/model-converter.service';
import { ModelValidatorService } from './conversion/validation/model-validator.service';
import { ProductARConfigService } from './ecommerce/product-ar-config.service';
import { VariantSwitcherService } from './ecommerce/variant-switcher.service';
import { PriceOverlayService } from './ecommerce/price-overlay.service';
import { AddToCartService } from './ecommerce/add-to-cart.service';
import { ShopifyARService } from './ecommerce/shopify-ar.service';
import { ARRoomService } from './collaboration/ar-room.service';
import { SharedAnchorService } from './collaboration/shared-anchor.service';
import { SyncStateService } from './collaboration/sync-state.service';
import { PresenceService } from './collaboration/presence.service';
import { SocialShareService } from './export/social-share.service';
import { EmbedGeneratorService } from './export/embed-generator.service';
import { ArEnhancedService } from './services/ar-enhanced.service';
import { FbxToGltfConverter } from './conversion/converters/fbx-to-gltf.converter';
import { GltfToUsdzConverter } from './conversion/converters/gltf-to-usdz.converter';
import { DracoEncoderService } from './conversion/optimization/draco-encoder.service';
import { LODGeneratorService } from './conversion/optimization/lod-generator.service';
import { TextureCompressorService } from './conversion/optimization/texture-compressor.service';
import { MeshOptimizerService } from './conversion/optimization/mesh-optimizer.service';
import { MaterialBakerService } from './conversion/optimization/material-baker.service';
import { ScaleCheckerService } from './conversion/validation/scale-checker.service';
import { OrientationFixerService } from './conversion/validation/orientation-fixer.service';
import { ConversionWorker } from './workers/conversion.worker';
import { OptimizationWorker } from './workers/optimization.worker';
import { AnalyticsAggregationWorker } from './workers/analytics-aggregation.worker';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    StorageModule,
    HttpModule,
    NotificationsModule,
    UsageBillingModule,
    BullModule.registerQueue(
      { name: 'ar-conversion' },
      { name: 'ar-optimization' },
      { name: 'ar-processing' },
      { name: 'ar-target-analysis' },
      { name: 'ar-qr-generation' },
      { name: 'ar-analytics' },
    ),
  ],
  controllers: [
    ArStudioController,
    ArIntegrationsController,
    ArCollaborationController,
    ArProjectsController,
    ArViewerController,
    ArModelsController,
    ArTargetsController,
    ArQrCodesController,
    ArAnalyticsController,
    ArEcommerceController,
    ARRoomsController,
  ],
  providers: [
    ArStudioService,
    ArIntegrationsService,
    ArCollaborationService,
    PlatformDetectorService,
    UsdzGeneratorService,
    ARQuickLookService,
    SceneViewerService,
    WebxrConfigService,
    ModelViewerConfigService,
    QRCodeRedirectService,
    TargetQualityAnalyzerService,
    FeatureExtractorService,
    TargetManagerService,
    ImageTargetService,
    QrGeneratorService,
    QrCustomizerService,
    QrAnalyticsService,
    DynamicLinkService,
    ArAnalyticsService,
    SessionTrackerService,
    EngagementCalculatorService,
    ConversionTrackerService,
    HeatmapGeneratorService,
    ModelConverterService,
    ModelValidatorService,
    ProductARConfigService,
    VariantSwitcherService,
    PriceOverlayService,
    AddToCartService,
    ShopifyARService,
    ARRoomService,
    SharedAnchorService,
    SyncStateService,
    PresenceService,
    SocialShareService,
    EmbedGeneratorService,
    ArEnhancedService,
    // Conversion pipeline
    FbxToGltfConverter,
    GltfToUsdzConverter,
    DracoEncoderService,
    LODGeneratorService,
    TextureCompressorService,
    MeshOptimizerService,
    MaterialBakerService,
    ScaleCheckerService,
    OrientationFixerService,
    // Workers
    ConversionWorker,
    OptimizationWorker,
    AnalyticsAggregationWorker,
  ],
  exports: [
    ArStudioService,
    ArIntegrationsService,
    ArCollaborationService,
    ModelConverterService,
    ModelValidatorService,
    PlatformDetectorService,
    SessionTrackerService,
    ArAnalyticsService,
  ],
})
export class ArStudioModule {}

