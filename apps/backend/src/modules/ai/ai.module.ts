import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AIStudioService } from './services/ai-studio.service';
import { AIStudioQueueService } from './services/ai-studio-queue.service';
import { AIImageService } from './services/ai-image.service';
import { MeshyProviderService } from './services/meshy-provider.service';
import { RunwayProviderService } from './services/runway-provider.service';
import { AITemplatesController } from './controllers/ai-templates.controller';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { BudgetModule } from '@/libs/budgets/budget.module';
import { AIOrchestratorModule } from '@/libs/ai/ai-orchestrator.module';
import { CreditsModule } from '@/libs/credits/credits.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    PrismaModule,
    BudgetModule,
    CreditsModule,
    AIOrchestratorModule,
    SmartCacheModule,
    PlansModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
    BullModule.registerQueue({
      name: 'ai-generation',
    }),
  ],
  controllers: [AiController, AITemplatesController],
  providers: [AiService, AIStudioService, AIStudioQueueService, AIImageService, MeshyProviderService, RunwayProviderService],
  exports: [AiService, AIStudioService, AIStudioQueueService, AIImageService, MeshyProviderService, RunwayProviderService],
})
export class AiModule {}
