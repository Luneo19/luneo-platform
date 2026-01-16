/**
 * @fileoverview Module PrestaShop
 * @module PrestaShopModule
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrestaShopService } from './prestashop.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { EcommerceModule } from '@/modules/ecommerce/ecommerce.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    EcommerceModule, // ✅ Import pour SyncEngineService
    BullModule.registerQueue({
      name: 'ecommerce-sync',
    }),
  ],
  providers: [PrestaShopService],
  exports: [PrestaShopService],
})
export class PrestaShopModule {}
