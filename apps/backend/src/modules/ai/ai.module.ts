import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
// Core controllers
import { AiController } from './ai.controller';
import { AITemplatesController } from './controllers/ai-templates.controller';
import { AIGenerationsController } from './controllers/ai-generations.controller';

// Core services
import { AiService } from './ai.service';
import { AIStudioService } from './services/ai-studio.service';
import { AIStudioQueueService } from './services/ai-studio-queue.service';
import { AIImageService } from './services/ai-image.service';
import { MeshyProviderService } from './services/meshy-provider.service';
import { RunwayProviderService } from './services/runway-provider.service';

// Provider Abstraction Layer (Phase 1.1)
import { ProviderRegistryService } from './providers/base/provider-registry.service';
import { IntelligentRouterService } from './providers/base/intelligent-router.service';
import { ProviderHealthService } from './providers/base/provider-health.service';

// Prompt Engineering (Phase 1.2)
import { PromptOptimizerService } from './prompt-engineering/prompt-optimizer.service';
import { NegativePromptsService } from './prompt-engineering/negative-prompts.service';
import { StylePresetsService } from './prompt-engineering/style-presets.service';
import { QualityEnhancersService } from './prompt-engineering/quality-enhancers.service';
import { IndustryTemplatesService } from './prompt-engineering/industry-templates.service';

// Cost Management (Phase 1.3)
import { CostEstimatorService } from './cost-management/cost-estimator.service';
import { BudgetGuardService } from './cost-management/budget-guard.service';
import { ProviderCostComparatorService } from './cost-management/provider-cost-comparator.service';
import { DynamicCreditCalculatorService } from './cost-management/dynamic-credit-calculator.service';

// Quality Assurance (Phase 3.1)
import { NSFWDetectorService } from './quality/nsfw-detector.service';
import { QualityScorerService } from './quality/quality-scorer.service';
import { WatermarkDetectorService } from './quality/watermark-detector.service';
import { BrandSafetyService } from './quality/brand-safety.service';
import { DuplicateDetectorService } from './quality/duplicate-detector.service';

// Caching (Phase 3.2)
import { PromptCacheService } from './caching/prompt-cache.service';
import { SemanticSearchService } from './caching/semantic-search.service';
import { ImageDeduplicationService } from './caching/image-deduplication.service';

// Feedback (Phase 3.3)
import { FeedbackController } from './feedback/feedback.controller';
import { FeedbackService } from './feedback/feedback.service';

// Bulk Generation (Phase 4.1)
import { BulkModule } from './bulk/bulk.module';

// Branding (Phase 4.2)
import { BrandingModule } from './branding/branding.module';

// A/B Testing (Phase 4.3)
import { ExperimentsModule } from './experiments/experiments.module';

// Legal (Phase 4.4)
import { LegalModule } from './legal/legal.module';

// Fine-Tuning (Phase 5.1)
import { FineTuningModule } from './fine-tuning/fine-tuning.module';

// Video/Animation (Phase 5.2)
import { AnimationModule } from './animation/animation.module';

// Collaboration (Phase 5.3)
import { CollaborationModule } from './collaboration/collaboration.module';

// Admin (Phase 6.1)
import { AIAdminModule } from './admin/admin.module';

// New Provider Implementations (Phase 2.1)
import { ReplicateSDXLProvider as NewReplicateSDXLProvider } from './providers/image-generation/replicate-sdxl.provider';
import { PikaLabsProvider } from './providers/animation/pika-labs.provider';
import { CSMAIProvider } from './providers/3d-generation/csm-ai.provider';

// External modules
import { GenerationModule } from '@/modules/generation/generation.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { BudgetModule } from '@/libs/budgets/budget.module';
import { AIOrchestratorModule } from '@/libs/ai/ai-orchestrator.module';
import { CreditsModule } from '@/libs/credits/credits.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    // Core infrastructure
    PrismaModule,
    GenerationModule,
    BudgetModule,
    CreditsModule,
    AIOrchestratorModule,
    SmartCacheModule,
    PlansModule,
    CacheModule.register({ ttl: 3600000 }),
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 3,
    }),
    BullModule.registerQueue(
      { name: 'ai-generation' },
      { name: 'ai-quality-check' },
      { name: 'ai-bulk-processing' },
      { name: 'ai-cache-cleanup' },
    ),

    // Feature modules (Phase 4-6)
    BulkModule,
    BrandingModule,
    ExperimentsModule,
    LegalModule,
    FineTuningModule,
    AnimationModule,
    CollaborationModule,
    AIAdminModule,
  ],
  controllers: [
    AiController,
    AITemplatesController,
    AIGenerationsController,
    FeedbackController,
  ],
  providers: [
    // Core services
    AiService,
    AIStudioService,
    AIStudioQueueService,
    AIImageService,
    MeshyProviderService,
    RunwayProviderService,

    // Provider Abstraction Layer
    ProviderRegistryService,
    IntelligentRouterService,
    ProviderHealthService,

    // Prompt Engineering
    PromptOptimizerService,
    NegativePromptsService,
    StylePresetsService,
    QualityEnhancersService,
    IndustryTemplatesService,

    // Cost Management
    CostEstimatorService,
    BudgetGuardService,
    ProviderCostComparatorService,
    DynamicCreditCalculatorService,

    // New Provider Implementations
    NewReplicateSDXLProvider,
    PikaLabsProvider,
    CSMAIProvider,

    // Quality Assurance
    NSFWDetectorService,
    QualityScorerService,
    WatermarkDetectorService,
    BrandSafetyService,
    DuplicateDetectorService,

    // Caching
    PromptCacheService,
    SemanticSearchService,
    ImageDeduplicationService,

    // Feedback
    FeedbackService,
  ],
  exports: [
    // Core
    AiService,
    AIStudioService,
    AIStudioQueueService,
    AIImageService,
    MeshyProviderService,
    RunwayProviderService,

    // Provider layer
    ProviderRegistryService,
    IntelligentRouterService,
    ProviderHealthService,

    // Prompt Engineering
    PromptOptimizerService,
    NegativePromptsService,
    StylePresetsService,

    // Cost Management
    CostEstimatorService,
    BudgetGuardService,
    DynamicCreditCalculatorService,

    // Quality
    NSFWDetectorService,
    QualityScorerService,

    // Caching
    PromptCacheService,
    SemanticSearchService,
    ImageDeduplicationService,

    // Feedback
    FeedbackService,
  ],
})
export class AiModule {}
