import { Module } from '@nestjs/common';
import { WebhookService } from './webhooks.service';
import { WebhookController } from './webhooks.controller';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, SmartCacheModule, HttpModule],
  providers: [WebhookService],
  controllers: [WebhookController],
  exports: [WebhookService],
})
export class WebhooksModule {}


