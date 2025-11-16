import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { EcommerceController } from './ecommerce.controller';
import { ShopifyConnector } from './connectors/shopify/shopify.connector';
import { WooCommerceConnector } from './connectors/woocommerce/woocommerce.connector';
import { MagentoConnector } from './connectors/magento/magento.connector';
import { ProductSyncService } from './services/product-sync.service';
import { OrderSyncService } from './services/order-sync.service';
import { WebhookHandlerService } from './services/webhook-handler.service';
import { EcommerceSyncQueueService } from './services/ecommerce-sync-queue.service';
import { EcommerceWebhookQueueService } from './services/ecommerce-webhook-queue.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { QueueNames } from '@/jobs/queue.constants';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    HttpModule,
    BullModule.registerQueue({
      name: QueueNames.ECOMMERCE_SYNC,
    }),
    BullModule.registerQueue({
      name: QueueNames.ECOMMERCE_WEBHOOKS,
    }),
  ],
  controllers: [EcommerceController],
  providers: [
    ShopifyConnector,
    WooCommerceConnector,
    MagentoConnector,
    ProductSyncService,
    OrderSyncService,
    WebhookHandlerService,
    EcommerceSyncQueueService,
    EcommerceWebhookQueueService,
  ],
  exports: [
    ShopifyConnector,
    WooCommerceConnector,
    MagentoConnector,
    ProductSyncService,
    OrderSyncService,
    EcommerceSyncQueueService,
    EcommerceWebhookQueueService,
  ],
})
export class EcommerceModule {}


