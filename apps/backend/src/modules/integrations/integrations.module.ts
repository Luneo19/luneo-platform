import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { ShopifyModule } from './shopify/shopify.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    HttpModule.register({ timeout: 30000, maxRedirects: 3 }),
    BullModule.registerQueue({
      name: 'integration-sync',
      defaultJobOptions: { removeOnComplete: 100, removeOnFail: 50, attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
    }),
    ShopifyModule,
  ],
  providers: [],
  exports: [ShopifyModule],
})
export class IntegrationsModule {}
