import { CreditsModule } from '@/libs/credits/credits.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlansModule } from '../plans/plans.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CommissionService } from './services/commission.service';

@Module({
  imports: [ConfigModule, CreditsModule, PrismaModule, PlansModule],
  controllers: [BillingController],
  providers: [BillingService, CommissionService],
  exports: [BillingService, CommissionService],
})
export class BillingModule {}
