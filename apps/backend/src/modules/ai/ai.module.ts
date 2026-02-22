import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { AiController } from './ai.controller';
import { AITemplatesController } from './controllers/ai-templates.controller';

import { AiService } from './ai.service';
import { AIStudioService } from './services/ai-studio.service';
import { AIStudioQueueService } from './services/ai-studio-queue.service';
import { AIEnhancedService } from './services/ai-enhanced.service';
import { AIImageService } from './services/ai-image.service';
import { MeshyProviderService } from './services/meshy-provider.service';
import { RunwayProviderService } from './services/runway-provider.service';

import { ProviderRegistryService } from './providers/base/provider-registry.service';
import { IntelligentRouterService } from './providers/base/intelligent-router.service';
import { ProviderHealthService } from './providers/base/provider-health.service';

import { PromptOptimizerService } from './prompt-engineering/prompt-optimizer.service';
import { NegativePromptsService } from './prompt-engineering/negative-prompts.service';
import { StylePresetsService } from './prompt-engineering/style-presets.service';
import { QualityEnhancersService } from './prompt-engineering/quality-enhancers.service';
import { IndustryTemplatesService } from './prompt-engineering/industry-templates.service';

import { CostEstimatorService } from './cost-management/cost-estimator.service';
import { BudgetGuardService } from './cost-management/budget-guard.service';
import { ProviderCostComparatorService } from './cost-management/provider-cost-comparator.service';
import { DynamicCreditCalculatorService } from './cost-management/dynamic-credit-calculator.service';

import { PromptCacheService } from './caching/prompt-cache.service';
import { SemanticSearchService } from './caching/semantic-search.service';

import { FeedbackController } from './feedback/feedback.controller';
import { FeedbackService } from './feedback/feedback.service';

import { BulkModule } from './bulk/bulk.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { LegalModule } from './legal/legal.module';
import { FineTuningModule } from './fine-tuning/fine-tuning.module';
import { AnimationModule } from './animation/animation.module';
import { AIAdminModule } from './admin/admin.module';

import { ReplicateSDXLProvider as NewReplicateSDXLProvider } from './providers/image-generation/replicate-sdxl.provider';
import { PikaLabsProvider } from './providers/animation/pika-labs.provider';
import { CSMAIProvider } from './providers/3d-generation/csm-ai.provider';

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
    CacheModule.register({ ttl: 3600000 }),
    HttpModule.register({ timeout: 60000, maxRedirects: 3 }),
    BullModule.registerQueue(
      { name: 'ai-generation' },
      { name: 'ai-quality-check' },
      { name: 'ai-bulk-processing' },
      { name: 'ai-cache-cleanup' },
    ),
    BulkModule,
    ExperimentsModule,
    LegalModule,
    FineTuningModule,
    AnimationModule,
    AIAdminModule,
  ],
  controllers: [AiController, AITemplatesController, FeedbackController],
  providers: [
    AiService,
    AIStudioService,
    AIStudioQueueService,
    AIEnhancedService,
    AIImageService,
    MeshyProviderService,
    RunwayProviderService,
    ProviderRegistryService,
    IntelligentRouterService,
    ProviderHealthService,
    PromptOptimizerService,
    NegativePromptsService,
    StylePresetsService,
    QualityEnhancersService,
    IndustryTemplatesService,
    CostEstimatorService,
    BudgetGuardService,
    ProviderCostComparatorService,
    DynamicCreditCalculatorService,
    NewReplicateSDXLProvider,
    PikaLabsProvider,
    CSMAIProvider,
    PromptCacheService,
    SemanticSearchService,
    FeedbackService,
  ],
  exports: [
    AiService,
    AIStudioService,
    AIStudioQueueService,
    AIEnhancedService,
    AIImageService,
    MeshyProviderService,
    RunwayProviderService,
    ProviderRegistryService,
    IntelligentRouterService,
    ProviderHealthService,
    PromptOptimizerService,
    NegativePromptsService,
    StylePresetsService,
    CostEstimatorService,
    BudgetGuardService,
    DynamicCreditCalculatorService,
    PromptCacheService,
    SemanticSearchService,
    FeedbackService,
  ],
})
export class AiModule {}
