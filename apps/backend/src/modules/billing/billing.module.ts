import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../../libs/prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';
import { OrdersModule } from '../orders/orders.module';
import { BillingTaxService } from './services/billing-tax.service';
import { BillingInvoiceService } from './services/billing-invoice.service';
import { BillingReportingService } from './services/billing-reporting.service';

@Module({
  imports: [ConfigModule, PrismaModule, PlansModule, OrdersModule],
  controllers: [BillingController],
  providers: [BillingService, BillingTaxService, BillingInvoiceService, BillingReportingService],
  exports: [BillingService, BillingTaxService, BillingInvoiceService, BillingReportingService],
})
export class BillingModule {}
