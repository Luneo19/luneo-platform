import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

// NOTE: Stripe webhook is handled exclusively in BillingModule.
// This module only handles SendGrid and other non-Stripe webhooks.

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}