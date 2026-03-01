import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PlaybooksService } from './playbooks.service';
import { QueuesModule } from '@/libs/queues';
import { VerticalsModule } from '@/modules/verticals/verticals.module';
import { CrawlerService } from './crawler.service';
import { VoiceAnalyzerService } from './voice-analyzer.service';
import { VerticalSetupService } from './vertical-setup.service';
import { CrawlWebsiteProcessor } from './crawl-website.processor';

@Module({
  imports: [PrismaModule, QueuesModule, VerticalsModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    PlaybooksService,
    CrawlerService,
    VoiceAnalyzerService,
    VerticalSetupService,
    CrawlWebsiteProcessor,
  ],
  exports: [OnboardingService, PlaybooksService, CrawlerService, VoiceAnalyzerService, VerticalSetupService],
})
export class OnboardingModule {}
