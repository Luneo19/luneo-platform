/**
 * @fileoverview Module PrestaShop
 * @module PrestaShopModule
 */

import { Module } from '@nestjs/common';
import { PrestaShopService } from './prestashop.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  providers: [PrestaShopService],
  exports: [PrestaShopService],
})
export class PrestaShopModule {}
