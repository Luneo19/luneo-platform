import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnterpriseController } from './enterprise.controller';
import { WhiteLabelService } from './services/white-label.service';
import { SSOService } from './services/sso.service';
import { SLASupportService } from './services/sla-support.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule, ConfigModule],
  controllers: [EnterpriseController],
  providers: [
    WhiteLabelService, // ✅ PHASE 8 - White-label
    SSOService, // ✅ PHASE 8 - SSO/SAML
    SLASupportService, // ✅ PHASE 8 - SLA & Support
  ],
  exports: [
    WhiteLabelService,
    SSOService,
    SLASupportService,
  ],
})
export class EnterpriseModule {}
