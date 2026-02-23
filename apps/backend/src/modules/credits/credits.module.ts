import { Module } from '@nestjs/common';
import { BillingModule } from '@/modules/billing/billing.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [BillingModule, PrismaModule],
  controllers: [],
})
export class CreditsModule {}
