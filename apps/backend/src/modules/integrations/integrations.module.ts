/**
 * @fileoverview Module principal des intégrations e-commerce
 * @module IntegrationsModule
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Export des services
 * - ✅ Import des dépendances
 * - ✅ Structure modulaire
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

// Sub-modules
import { ShopifyModule } from './shopify/shopify.module';
import { WooCommerceModule } from './woocommerce/woocommerce.module';
import { PrestaShopModule } from './prestashop/prestashop.module';
import { ZapierModule } from './zapier/zapier.module';

// Shared services
import { IntegrationOrchestratorService } from './services/integration-orchestrator.service';
import { SyncEngineService } from './services/sync-engine.service';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { EcommerceConnectorService } from './services/ecommerce-connector.service';

// Infrastructure
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
    BullModule.registerQueue({
      name: 'integration-sync',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    // Sub-modules
    ShopifyModule,
    WooCommerceModule,
    PrestaShopModule,
    ZapierModule,
  ],
  providers: [
    IntegrationOrchestratorService,
    SyncEngineService,
    WebhookProcessorService,
    EcommerceConnectorService,
  ],
  exports: [
    IntegrationOrchestratorService,
    SyncEngineService,
    WebhookProcessorService,
    EcommerceConnectorService,
    ShopifyModule,
    WooCommerceModule,
    PrestaShopModule,
    ZapierModule,
  ],
})
export class IntegrationsModule {}
