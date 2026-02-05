import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DiscountService } from './services/discount.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ReferralModule } from '../referral/referral.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [PrismaModule, ReferralModule, BillingModule],
  controllers: [OrdersController],
  providers: [OrdersService, DiscountService],
  exports: [OrdersService],
})
export class OrdersModule {}
