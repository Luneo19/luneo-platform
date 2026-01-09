import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsModule as CreditsLibModule } from '@/libs/credits/credits.module';
import { BillingModule } from '@/modules/billing/billing.module';

@Module({
  imports: [CreditsLibModule, BillingModule],
  controllers: [CreditsController],
})
export class CreditsModule {}













