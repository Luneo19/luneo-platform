import { Module, forwardRef } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { BillingModule } from '@/modules/billing/billing.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BillingModule),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}