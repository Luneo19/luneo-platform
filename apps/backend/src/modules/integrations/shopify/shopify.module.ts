/**
 * @fileoverview Module Shopify
 * @module ShopifyModule
 * 
 * SEC-06: Intégration du chiffrement AES-256-GCM pour les credentials
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { ShopifyController } from './shopify.controller';
import { ShopifyService } from './shopify.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { CryptoModule } from '@/libs/crypto/crypto.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    CryptoModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'integration-sync',
    }),
  ],
  controllers: [ShopifyController],
  providers: [ShopifyService],
  exports: [ShopifyService],
})
export class ShopifyModule {}
