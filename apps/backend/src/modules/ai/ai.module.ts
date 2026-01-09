import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AIStudioService } from './services/ai-studio.service';
import { AIStudioQueueService } from './services/ai-studio-queue.service';
import { AIImageService } from './services/ai-image.service';
import { AITemplatesController } from './controllers/ai-templates.controller';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { BudgetModule } from '@/libs/budgets/budget.module';
import { AIOrchestratorModule } from '@/libs/ai/ai-orchestrator.module';
import { CreditsModule } from '@/libs/credits/credits.module';

@Module({
  imports: [
    PrismaModule,
    BudgetModule,
    CreditsModule,
    AIOrchestratorModule,
    BullModule.registerQueue({
      name: 'ai-generation',
    }),
  ],
  controllers: [AiController, AITemplatesController],
  providers: [AiService, AIStudioService, AIStudioQueueService, AIImageService],
  exports: [AiService, AIStudioService, AIStudioQueueService, AIImageService],
})
export class AiModule {}
