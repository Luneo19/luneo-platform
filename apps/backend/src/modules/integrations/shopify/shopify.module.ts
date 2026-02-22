/**
 * @fileoverview Module Shopify
 * @module ShopifyModule
 *
 * SEC-06: Intégration du chiffrement AES-256-GCM pour les credentials
 * V2: ShopifyIntegrationService pour Agents IA (modèle Integration)
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { ShopifyController } from './shopify.controller';
import { ShopifyService } from './shopify.service';
import { ShopifyIntegrationController } from './shopify-integration.controller';
import { ShopifyIntegrationService } from './shopify-integration.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { CryptoModule } from '@/libs/crypto/crypto.module';

@Module({
  imports: [
    PrismaModule,
    PrismaOptimizedModule,
    SmartCacheModule,
    CryptoModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'integration-sync',
    }),
  ],
  controllers: [ShopifyController, ShopifyIntegrationController],
  providers: [ShopifyService, ShopifyIntegrationService],
  exports: [ShopifyService, ShopifyIntegrationService],
})
export class ShopifyModule {}
