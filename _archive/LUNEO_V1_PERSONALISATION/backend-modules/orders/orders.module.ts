import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { DiscountController, DiscountCodesPublicController } from './discount.controller';
import { OrdersService } from './orders.service';
import { DiscountService } from './services/discount.service';
import { OrdersEnhancedService } from './services/orders-enhanced.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ReferralModule } from '../referral/referral.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ZapierModule } from '@/modules/integrations/zapier/zapier.module';

@Module({
  imports: [PrismaModule, ReferralModule, BillingModule, NotificationsModule, ZapierModule],
  controllers: [OrdersController, DiscountController, DiscountCodesPublicController],
  providers: [OrdersService, DiscountService, OrdersEnhancedService],
  exports: [OrdersService, OrdersEnhancedService],
})
export class OrdersModule {}
