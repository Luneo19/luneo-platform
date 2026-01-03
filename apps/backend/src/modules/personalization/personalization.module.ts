import { Module } from '@nestjs/common';
import { PersonalizationController } from './personalization.controller';
import { PersonalizationService } from './personalization.service';
import { RulesEngineService } from './services/rules-engine.service';
import { UnicodeNormalizerService } from './services/unicode-normalizer.service';
import { TextValidatorService } from './services/text-validator.service';
import { AutoFitService } from './services/auto-fit.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [PersonalizationController],
  providers: [
    PersonalizationService,
    RulesEngineService,
    UnicodeNormalizerService,
    TextValidatorService,
    AutoFitService,
  ],
  exports: [PersonalizationService],
})
export class PersonalizationModule {}






