import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
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

@Module({
  imports: [PrismaOptimizedModule, SmartCacheModule, OrchestratorModule, EmailModule],
  controllers: [ChannelsController, EmailInboundController, EmailWebhookController],
  providers: [ChannelsService, EmailInboundService, EmailParserService, EmailOutboundService, EmailInboundV2Service],
  exports: [ChannelsService, EmailOutboundService],
})
export class ChannelsModule {}
