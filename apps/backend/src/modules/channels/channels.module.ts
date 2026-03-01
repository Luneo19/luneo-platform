import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { IdempotencyModule } from '@/libs/idempotency/idempotency.module';
import { OrchestratorModule } from '@/modules/orchestrator/orchestrator.module';
import { EmailModule } from '@/modules/email/email.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { EmailInboundController } from './email-inbound.controller';
import { EmailInboundService } from './email-inbound.service';
import { EmailParserService } from './email/email-parser.service';
import { EmailOutboundService } from './email/email-outbound.service';
import { EmailInboundService as EmailInboundV2Service } from './email/email-inbound.service';
import { EmailWebhookController } from './email/email-webhook.controller';
import {
  WhatsAppProvider,
  TelegramProvider,
  MessengerProvider,
  SmsProvider,
  SlackProvider,
} from './providers';
import { ChannelRouterService } from './channel-router.service';
import { ChannelReliabilityService } from './channel-reliability.service';
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';
import { EmailAdapter } from './adapters/email.adapter';
import { WebchatAdapter } from './adapters/webchat.adapter';

@Module({
  imports: [
    PrismaOptimizedModule,
    SmartCacheModule,
    IdempotencyModule,
    OrchestratorModule,
    EmailModule,
    ConfigModule,
  ],
  controllers: [ChannelsController, EmailInboundController, EmailWebhookController],
  providers: [
    ChannelsService,
    EmailInboundService,
    EmailParserService,
    EmailOutboundService,
    EmailInboundV2Service,
    WhatsAppProvider,
    TelegramProvider,
    MessengerProvider,
    SmsProvider,
    SlackProvider,
    ChannelRouterService,
    ChannelReliabilityService,
    WhatsAppAdapter,
    EmailAdapter,
    WebchatAdapter,
  ],
  exports: [
    ChannelsService,
    EmailOutboundService,
    ChannelRouterService,
    ChannelReliabilityService,
    WhatsAppAdapter,
    EmailAdapter,
    WebchatAdapter,
  ],
})
export class ChannelsModule {}
