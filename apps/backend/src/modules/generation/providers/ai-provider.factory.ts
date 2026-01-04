import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProvider } from '@/libs/ai/providers/openai.provider';
import { ReplicateSDXLProvider } from '@/libs/ai/providers/replicate-sdxl.provider';
import { StabilityProvider } from './stability.provider';
import { AIProvider } from '@/libs/ai/providers/ai-provider.interface';

@Injectable()
export class AIProviderFactory {
  private readonly logger = new Logger(AIProviderFactory.name);
  private providers: Map<string, AIProvider> = new Map();

  constructor(
    private readonly openaiProvider: OpenAIProvider,
    private readonly replicateProvider: ReplicateSDXLProvider,
    private readonly stabilityProvider: StabilityProvider,
  ) {
    // Enregistrer les providers
    this.providers.set('openai', openaiProvider);
    this.providers.set('replicate', replicateProvider);
    this.providers.set('stability', stabilityProvider);
  }

  getProvider(name: string): AIProvider {
    const provider = this.providers.get(name);
    
    if (!provider) {
      this.logger.warn(`Provider ${name} not found, falling back to OpenAI`);
      return this.openaiProvider;
    }

    return provider;
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  async getAvailableProvider(preferred?: string): Promise<AIProvider> {
    // Si un provider est préféré et disponible, l'utiliser
    if (preferred) {
      const provider = this.getProvider(preferred);
      const isAvailable = await provider.isAvailable();
      if (isAvailable) {
        return provider;
      }
    }

    // Sinon, trouver le premier provider disponible
    for (const provider of this.providers.values()) {
      const isAvailable = await provider.isAvailable();
      if (isAvailable) {
        return provider;
      }
    }

    // Fallback sur OpenAI
    this.logger.warn('No available provider found, using OpenAI as fallback');
    return this.openaiProvider;
  }
}


