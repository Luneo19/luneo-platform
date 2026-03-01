import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { PricingPlansService } from './services/pricing-plans.service';
import { PricingController } from './pricing.controller';
import { PlansCompatController } from './plans-compat.controller';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [PricingController, PlansCompatController],
  providers: [PricingPlansService],
  exports: [PricingPlansService],
})
export class PricingModule {}
