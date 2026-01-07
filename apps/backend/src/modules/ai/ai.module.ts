import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AIStudioService } from './services/ai-studio.service';
import { AIStudioQueueService } from './services/ai-studio-queue.service';
import { AITemplatesController } from './controllers/ai-templates.controller';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { BudgetModule } from '@/libs/budgets/budget.module';
import { AIOrchestratorModule } from '@/libs/ai/ai-orchestrator.module';

@Module({
  imports: [
    PrismaModule,
    BudgetModule,
    AIOrchestratorModule,
    BullModule.registerQueue({
      name: 'ai-generation',
    }),
  ],
  controllers: [AiController, AITemplatesController],
  providers: [AiService, AIStudioService, AIStudioQueueService],
  exports: [AiService, AIStudioService, AIStudioQueueService],
})
export class AiModule {}
