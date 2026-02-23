import { Module } from '@nestjs/common';
import { BillingModule } from '@/modules/billing/billing.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { CreditsController } from './credits.controller';

@Module({
  imports: [BillingModule, PrismaModule],
  controllers: [CreditsController],
})
export class CreditsModule {}
