/**
 * @fileoverview Module WooCommerce
 * @module WooCommerceModule
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WooCommerceService } from './woocommerce.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { EcommerceModule } from '@/modules/ecommerce/ecommerce.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    EcommerceModule, // ✅ Import pour WooCommerceConnector et SyncEngineService
    BullModule.registerQueue({
      name: 'ecommerce-sync',
    }),
  ],
  providers: [WooCommerceService],
  exports: [WooCommerceService],
})
export class WooCommerceModule {}
