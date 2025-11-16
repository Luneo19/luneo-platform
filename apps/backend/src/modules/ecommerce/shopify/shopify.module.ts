import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShopifyController } from './shopify.controller';
import { ShopifyService } from './shopify.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { EncryptionModule } from '@/libs/encryption/encryption.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [
    PrismaModule,
    EncryptionModule,
    SmartCacheModule,
    HttpModule,
  ],
  controllers: [ShopifyController],
  providers: [ShopifyService],
  exports: [ShopifyService],
})
export class ShopifyModule {}
