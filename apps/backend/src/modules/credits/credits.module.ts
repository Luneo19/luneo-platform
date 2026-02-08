import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsModule as CreditsLibModule } from '@/libs/credits/credits.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [CreditsLibModule, BillingModule, PrismaModule],
  controllers: [CreditsController],
})
export class CreditsModule {}













