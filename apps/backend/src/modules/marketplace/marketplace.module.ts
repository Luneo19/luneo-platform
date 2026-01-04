import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { ArtisanOnboardingService } from './services/artisan-onboarding.service';
import { OrderRoutingService } from './services/order-routing.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { SLAEnforcementService } from './services/sla-enforcement.service';
import { QCSystemService } from './services/qc-system.service';
import { MarketplaceScheduler } from './schedulers/marketplace.scheduler';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, ScheduleModule],
  controllers: [MarketplaceController],
  providers: [
    ArtisanOnboardingService,
    OrderRoutingService,
    StripeConnectService,
    SLAEnforcementService,
    QCSystemService,
    MarketplaceScheduler,
  ],
  exports: [
    ArtisanOnboardingService,
    OrderRoutingService,
    StripeConnectService,
    SLAEnforcementService,
    QCSystemService,
  ],
})
export class MarketplaceModule {}





























