import { Injectable, Logger } from '@nestjs/common';
import {
  AICapability,
  EnhancedAIProvider,
} from '@/modules/ai/providers/base/ai-provider.interface';

@Injectable()
export class ProviderRegistryService {
  private readonly logger = new Logger(ProviderRegistryService.name);
  private readonly providers = new Map<string, EnhancedAIProvider>();

  register(provider: EnhancedAIProvider): void {
    const name = provider.getName();
    if (this.providers.has(name)) {
      this.logger.warn(`Overwriting existing provider registration: ${name}`);
    }
    this.providers.set(name, provider);
    this.logger.log(`Registered AI provider: ${provider.getDisplayName()} (${name})`);
  }

  get(name: string): EnhancedAIProvider | undefined {
    return this.providers.get(name);
  }

  getByCapability(capability: AICapability): EnhancedAIProvider[] {
    return Array.from(this.providers.values())
      .filter((p) => p.supportsCapability(capability) && p.getConfig().enabled)
      .sort((a, b) => a.getConfig().priority - b.getConfig().priority);
  }

  getAll(): EnhancedAIProvider[] {
    return Array.from(this.providers.values());
  }

  async getAvailable(capability: AICapability): Promise<EnhancedAIProvider[]> {
    const byCapability = this.getByCapability(capability);
    const available: EnhancedAIProvider[] = [];

    for (const provider of byCapability) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          available.push(provider);
        }
      } catch (err) {
        this.logger.debug(
          `Provider ${provider.getName()} availability check failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return available;
  }
}
