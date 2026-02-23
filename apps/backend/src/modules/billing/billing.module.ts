import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { SecurityModule } from '../security/security.module';
import { ReferralModule } from '../referral/referral.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeClientService } from './services/stripe-client.service';
import { InvoiceTaxService } from './services/invoice-tax.service';
import { BillingEnhancedService } from './services/billing-enhanced.service';

@Module({
  imports: [ConfigModule, PrismaModule, RedisOptimizedModule, EmailModule, SecurityModule, ReferralModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, StripeService, StripeClientService, InvoiceTaxService, BillingEnhancedService],
  exports: [BillingService, StripeService, StripeClientService, InvoiceTaxService, BillingEnhancedService],
})
export class BillingModule {}
