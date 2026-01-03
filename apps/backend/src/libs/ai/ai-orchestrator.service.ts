import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AIProvider, AIGenerationOptions, AIGenerationResult } from './providers/ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { ReplicateSDXLProvider } from './providers/replicate-sdxl.provider';
import { BudgetService } from '@/libs/budgets/budget.service';

export interface RoutingStrategy {
  stage: 'exploration' | 'final' | 'preview';
  quality: 'standard' | 'hd';
  budget?: number; // Budget max en cents
  preferredProvider?: string;
}

@Injectable()
export class AIOrchestratorService {
  private readonly logger = new Logger(AIOrchestratorService.name);
  private readonly providers: Map<string, AIProvider> = new Map();

  constructor(
    private readonly openaiProvider: OpenAIProvider,
    private readonly replicateProvider: ReplicateSDXLProvider,
    private readonly budgetService: BudgetService,
  ) {
    // Enregistrer les providers
    this.registerProvider(openaiProvider);
    this.registerProvider(replicateProvider);
  }

  /**
   * Enregistre un provider
   */
  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.getName(), provider);
    this.logger.log(`Registered AI provider: ${provider.getName()}`);
  }

  /**
   * Route vers le meilleur provider selon la stratégie
   */
  async routeToProvider(
    options: AIGenerationOptions,
    strategy: RoutingStrategy,
    brandId: string,
  ): Promise<AIProvider> {
    // 1. Vérifier le budget
    const estimatedCost = await this.estimateCost(options, strategy);
    const hasBudget = await this.budgetService.checkBudget(brandId, estimatedCost);

    if (!hasBudget) {
      throw new BadRequestException(
        `Budget exceeded. Estimated cost: ${estimatedCost} cents. Please upgrade your plan.`,
      );
    }

    // 2. Sélectionner le provider selon la stratégie
    let selectedProvider: AIProvider | null = null;

    // Provider préféré explicite
    if (strategy.preferredProvider) {
      selectedProvider = this.providers.get(strategy.preferredProvider) || null;
      if (selectedProvider && await selectedProvider.isAvailable()) {
        return selectedProvider;
      }
    }

    // Routing intelligent selon l'étape
    if (strategy.stage === 'exploration' || strategy.stage === 'preview') {
      // Pour exploration/preview: utiliser le provider le moins cher
      selectedProvider = await this.selectCheapestProvider(options);
    } else if (strategy.stage === 'final') {
      // Pour final: utiliser le provider de meilleure qualité
      selectedProvider = await this.selectBestQualityProvider(options);
    }

    // Fallback: utiliser le premier provider disponible
    if (!selectedProvider) {
      selectedProvider = await this.selectFirstAvailableProvider();
    }

    if (!selectedProvider) {
      throw new BadRequestException('No AI provider available');
    }

    this.logger.debug(`Routed to provider: ${selectedProvider.getName()}`, {
      strategy,
      estimatedCost,
    });

    return selectedProvider;
  }

  /**
   * Génère une image avec routing intelligent
   */
  async generateImage(
    options: AIGenerationOptions,
    strategy: RoutingStrategy,
    brandId: string,
  ): Promise<AIGenerationResult> {
    const provider = await this.routeToProvider(options, strategy, brandId);
    const result = await provider.generateImage(options);

    // Appliquer le budget après génération
    await this.budgetService.enforceBudget(brandId, result.costs.costCents);

    return result;
  }

  /**
   * Estime le coût pour une génération
   */
  async estimateCost(
    options: AIGenerationOptions,
    strategy: RoutingStrategy,
  ): Promise<number> {
    // Estimer avec le provider qui serait sélectionné
    if (strategy.stage === 'exploration' || strategy.stage === 'preview') {
      const cheapest = await this.selectCheapestProvider(options);
      return cheapest ? cheapest.estimateCost(options) : 100; // Fallback
    } else {
      const best = await this.selectBestQualityProvider(options);
      return best ? best.estimateCost(options) : 100; // Fallback
    }
  }

  /**
   * Sélectionne le provider le moins cher
   */
  private async selectCheapestProvider(options: AIGenerationOptions): Promise<AIProvider | null> {
    const availableProviders = await this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return null;
    }

    // Trier par coût estimé
    const providersWithCost = await Promise.all(
      availableProviders.map(async (provider) => ({
        provider,
        cost: provider.estimateCost(options),
      })),
    );

    providersWithCost.sort((a, b) => a.cost - b.cost);
    return providersWithCost[0]?.provider || null;
  }

  /**
   * Sélectionne le provider de meilleure qualité
   */
  private async selectBestQualityProvider(options: AIGenerationOptions): Promise<AIProvider | null> {
    const availableProviders = await this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return null;
    }

    // OpenAI est généralement de meilleure qualité
    const openai = availableProviders.find((p) => p.getName() === 'openai');
    return openai || availableProviders[0] || null;
  }

  /**
   * Sélectionne le premier provider disponible
   */
  private async selectFirstAvailableProvider(): Promise<AIProvider | null> {
    const availableProviders = await this.getAvailableProviders();
    return availableProviders[0] || null;
  }

  /**
   * Récupère tous les providers disponibles
   */
  private async getAvailableProviders(): Promise<AIProvider[]> {
    const providers: AIProvider[] = [];

    for (const provider of this.providers.values()) {
      if (await provider.isAvailable()) {
        providers.push(provider);
      }
    }

    // Trier par priorité (priority bas = priorité haute)
    providers.sort((a, b) => a.getConfig().priority - b.getConfig().priority);

    return providers;
  }

  /**
   * Modère un prompt (utilise le provider avec modération native)
   */
  async moderatePrompt(prompt: string): Promise<{
    isApproved: boolean;
    reason?: string;
    confidence: number;
    categories?: string[];
  }> {
    // Utiliser OpenAI pour la modération (meilleure qualité)
    const openai = this.providers.get('openai');
    if (openai && await openai.isAvailable()) {
      return openai.moderatePrompt(prompt);
    }

    // Fallback: approuver par défaut (fail-open)
    this.logger.warn('No moderation provider available, approving by default');
    return {
      isApproved: true,
      confidence: 0.5,
    };
  }

  /**
   * Liste tous les providers disponibles
   */
  async listProviders(): Promise<Array<{
    name: string;
    enabled: boolean;
    priority: number;
    costPerImageCents: number;
    available: boolean;
  }>> {
    const providers = Array.from(this.providers.values());

    return Promise.all(
      providers.map(async (provider) => {
        const config = provider.getConfig();
        return {
          name: config.name,
          enabled: config.enabled,
          priority: config.priority,
          costPerImageCents: config.costPerImageCents,
          available: await provider.isAvailable(),
        };
      }),
    );
  }
}




























