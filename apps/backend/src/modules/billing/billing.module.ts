import { CreditsModule } from '@/libs/credits/credits.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlansModule } from '../plans/plans.module';
import { EmailModule } from '../email/email.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CommissionService } from './services/commission.service';
import { StripeClientService } from './services/stripe-client.service';
import { StripeWebhookService } from './services/stripe-webhook.service';

@Module({
  imports: [ConfigModule, CreditsModule, PrismaModule, PlansModule, EmailModule],
  controllers: [BillingController],
  providers: [BillingService, StripeClientService, StripeWebhookService, CommissionService],
  exports: [BillingService, StripeClientService, CommissionService],
})
export class BillingModule {}
