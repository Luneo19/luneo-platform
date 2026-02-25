import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PlaybooksService } from './playbooks.service';

@Module({
  imports: [PrismaModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, PlaybooksService],
  exports: [OnboardingService, PlaybooksService],
})
export class OnboardingModule {}
