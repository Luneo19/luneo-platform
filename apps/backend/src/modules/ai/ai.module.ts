import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiQueueService } from './services/ai-queue.service';
import { PromptGuardService } from './services/prompt-guard.service';
import { PromptLocalizationService } from './services/prompt-localization.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { QueueNames } from '@/jobs/queue.constants';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: QueueNames.AI_GENERATION,
    }),
  ],
  controllers: [AiController],
  providers: [AiService, AiQueueService, PromptGuardService, PromptLocalizationService],
  exports: [AiService, AiQueueService, PromptGuardService, PromptLocalizationService],
})
export class AiModule {}
