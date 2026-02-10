import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { ArtisanOnboardingService } from './services/artisan-onboarding.service';
import { OrderRoutingService } from './services/order-routing.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { SLAEnforcementService } from './services/sla-enforcement.service';
import { QCSystemService } from './services/qc-system.service';
import { MarketplaceScheduler } from './schedulers/marketplace.scheduler';
import { CreatorProfileService } from './services/creator-profile.service'; // ✅ PHASE 7
import { MarketplaceTemplateService } from './services/marketplace-template.service'; // ✅ PHASE 7
import { RevenueSharingService } from './services/revenue-sharing.service'; // ✅ PHASE 7
import { EngagementService } from './services/engagement.service'; // ✅ PHASE 7
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { CloudinaryModule } from '@/libs/storage/cloudinary.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, SmartCacheModule, ConfigModule, CloudinaryModule, ScheduleModule],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService, // ✅ PHASE 8 - Brand-to-brand marketplace
    ArtisanOnboardingService,
    OrderRoutingService,
    StripeConnectService,
    SLAEnforcementService,
    QCSystemService,
    MarketplaceScheduler,
    CreatorProfileService, // ✅ PHASE 7 - Profils créateurs
    MarketplaceTemplateService, // ✅ PHASE 7 - Templates marketplace
    RevenueSharingService, // ✅ PHASE 7 - Revenue sharing
    EngagementService, // ✅ PHASE 7 - Engagement
  ],
  exports: [
    MarketplaceService,
    ArtisanOnboardingService,
    OrderRoutingService,
    StripeConnectService,
    SLAEnforcementService,
    QCSystemService,
    CreatorProfileService, // ✅ Exporter pour utilisation dans autres modules
    MarketplaceTemplateService,
    RevenueSharingService,
    EngagementService,
  ],
})
export class MarketplaceModule {}

































