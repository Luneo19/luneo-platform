import { Module } from '@nestjs/common';
import { TrustSafetyController } from './trust-safety.controller';
import { ContentModerationService } from './services/content-moderation.service';
import { IPClaimsService } from './services/ip-claims.service';
import { AntiFraudeService } from './services/anti-fraude.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [TrustSafetyController],
  providers: [ContentModerationService, IPClaimsService, AntiFraudeService],
  exports: [ContentModerationService, IPClaimsService, AntiFraudeService],
})
export class TrustSafetyModule {}





























