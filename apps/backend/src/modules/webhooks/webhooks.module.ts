import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { QueuesModule } from '@/libs/queues';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhooksDlqProcessor } from './webhooks.dlq.processor';

@Module({
  imports: [PrismaOptimizedModule, QueuesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhooksDlqProcessor],
  exports: [WebhooksService],
})
export class WebhooksModule {}
