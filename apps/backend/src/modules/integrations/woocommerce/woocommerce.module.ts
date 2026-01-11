/**
 * @fileoverview Module WooCommerce
 * @module WooCommerceModule
 */

import { Module } from '@nestjs/common';
import { WooCommerceService } from './woocommerce.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  providers: [WooCommerceService],
  exports: [WooCommerceService],
})
export class WooCommerceModule {}
