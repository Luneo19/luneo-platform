import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { EcommerceController } from './ecommerce.controller';
import { ShopifyConnector } from './connectors/shopify/shopify.connector';
import { WooCommerceConnector } from './connectors/woocommerce/woocommerce.connector';
import { MagentoConnector } from './connectors/magento/magento.connector';
import { ProductSyncService } from './services/product-sync.service';
import { OrderSyncService } from './services/order-sync.service';
import { WebhookHandlerService } from './services/webhook-handler.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'ecommerce-sync',
    }),
    BullModule.registerQueue({
      name: 'ecommerce-webhooks',
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
  ],
  exports: [
    ShopifyConnector,
    WooCommerceConnector,
    MagentoConnector,
    ProductSyncService,
    OrderSyncService,
  ],
})
export class EcommerceModule {}


