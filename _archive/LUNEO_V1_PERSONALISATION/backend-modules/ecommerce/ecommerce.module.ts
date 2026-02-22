import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { EcommerceController } from './ecommerce.controller';
import { WooCommerceWebhookController } from './controllers/woocommerce-webhook.controller';
import { ShopifyConnector } from './connectors/shopify/shopify.connector';
import { WooCommerceConnector } from './connectors/woocommerce/woocommerce.connector';
import { MagentoConnector } from './connectors/magento/magento.connector';
import { ProductSyncService } from './services/product-sync.service';
import { OrderSyncService } from './services/order-sync.service';
import { WebhookHandlerService } from './services/webhook-handler.service';
import { WooCommerceWebhookService } from './services/woocommerce-webhook.service';
import { SyncEngineService } from './services/sync-engine.service';
import { SyncWorker } from './workers/sync.worker';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { CryptoModule } from '@/libs/crypto/crypto.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    CryptoModule, // SEC-06: Chiffrement AES-256-GCM des credentials
    /**
     * TIMEOUT-01: Configuration HttpModule avec timeout 30s pour Shopify/WooCommerce
     * Évite les requêtes qui bloquent indéfiniment
     */
    HttpModule.register({
      timeout: 30000, // 30 secondes
      maxRedirects: 5,
    }),
    BullModule.registerQueue({
      name: 'ecommerce-sync',
    }),
    BullModule.registerQueue({
      name: 'ecommerce-webhooks',
    }),
  ],
  controllers: [EcommerceController, WooCommerceWebhookController],
  providers: [
    ShopifyConnector,
    WooCommerceConnector,
    MagentoConnector,
    ProductSyncService,
    OrderSyncService,
    WebhookHandlerService,
    WooCommerceWebhookService,
    SyncEngineService, // ✅ PHASE 4 - Service centralisé pour jobs BullMQ
    SyncWorker, // ✅ PHASE 4 - Worker pour traiter les jobs
  ],
  exports: [
    ShopifyConnector,
    WooCommerceConnector,
    MagentoConnector,
    ProductSyncService,
    OrderSyncService,
    WooCommerceWebhookService,
    SyncEngineService, // ✅ Exporter pour utilisation dans autres modules
  ],
})
export class EcommerceModule {}


