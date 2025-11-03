import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { SlackService } from './slack/slack.service';
import { ZapierService } from './zapier/zapier.service';
import { WebhookIntegrationService } from './webhook-integration/webhook-integration.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, SmartCacheModule, HttpModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    SlackService,
    ZapierService,
    WebhookIntegrationService,
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}


