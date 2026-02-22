import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { OrchestratorModule } from '@/modules/orchestrator/orchestrator.module';
import { EmailModule } from '@/modules/email/email.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { EmailInboundController } from './email-inbound.controller';
import { EmailInboundService } from './email-inbound.service';

@Module({
  imports: [PrismaOptimizedModule, SmartCacheModule, OrchestratorModule, EmailModule],
  controllers: [ChannelsController, EmailInboundController],
  providers: [ChannelsService, EmailInboundService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
