import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { PricingPlansService } from './services/pricing-plans.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [PricingController],
  providers: [PricingPlansService],
  exports: [PricingPlansService],
})
export class PricingModule {}
