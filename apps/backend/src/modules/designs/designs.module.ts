import { Module } from '@nestjs/common';
import { DesignsController } from './designs.controller';
import { DesignsService } from './designs.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { AiModule } from '@/modules/ai/ai.module';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { QuotaGuard } from '@/common/guards/quota.guard';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    UsageBillingModule,
  ],
  controllers: [DesignsController],
  providers: [DesignsService, QuotaGuard],
  exports: [DesignsService],
})
export class DesignsModule {}
