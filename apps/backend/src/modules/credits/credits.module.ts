import { Module } from '@nestjs/common';
import { BillingModule } from '@/modules/billing/billing.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';

@Module({
  imports: [BillingModule, PrismaModule],
  controllers: [CreditsController],
  providers: [CreditsService],
})
export class CreditsModule {}
