import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { IdempotencyModule } from '@/libs/idempotency/idempotency.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { SecurityModule } from '../security/security.module';
import { ReferralModule } from '../referral/referral.module';
import { QueuesModule } from '@/libs/queues/queues.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeClientService } from './services/stripe-client.service';
import { InvoiceTaxService } from './services/invoice-tax.service';
import { BillingEnhancedService } from './services/billing-enhanced.service';
import { BillingUsageProcessor } from './billing-usage.processor';
import { BillingUsageScheduler } from './billing-usage.scheduler';

@Module({
  imports: [ConfigModule, PrismaModule, RedisOptimizedModule, IdempotencyModule, EmailModule, SecurityModule, ReferralModule, QueuesModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, StripeService, StripeClientService, InvoiceTaxService, BillingEnhancedService, BillingUsageProcessor, BillingUsageScheduler],
  exports: [BillingService, StripeService, StripeClientService, InvoiceTaxService, BillingEnhancedService],
})
export class BillingModule {}
