import { CreditsModule } from '@/libs/credits/credits.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZapierModule } from '@/modules/integrations/zapier/zapier.module';
import { PlansModule } from '../plans/plans.module';
import { EmailModule } from '../email/email.module';
import { SecurityModule } from '../security/security.module';
import { ReferralModule } from '../referral/referral.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { CommissionService } from './services/commission.service';
import { StripeClientService } from './services/stripe-client.service';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { InvoiceTaxService } from './services/invoice-tax.service';
import { BillingEnhancedService } from './services/billing-enhanced.service';

@Module({
  imports: [ConfigModule, CreditsModule, PrismaModule, RedisOptimizedModule, PlansModule, EmailModule, SecurityModule, ZapierModule, ReferralModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, StripeService, StripeClientService, StripeWebhookService, CommissionService, InvoiceTaxService, BillingEnhancedService],
  exports: [BillingService, StripeService, StripeClientService, CommissionService, InvoiceTaxService, BillingEnhancedService],
})
export class BillingModule {}
