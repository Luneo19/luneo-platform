import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AICapability,
  AIGenerationRequest,
  AIGenerationResponse,
  EnhancedAIProvider,
  EnhancedAIProviderConfig,
  ProviderHealthInfo,
  ProviderStatus,
} from '../base/ai-provider.interface';

/**
 * Pika Labs video generation provider.
 * Activates automatically when PIKA_LABS_API_TOKEN is set.
 * Falls back gracefully when not configured.
 */
@Injectable()
export class PikaLabsProvider implements EnhancedAIProvider {
  private readonly logger = new Logger(PikaLabsProvider.name);
  private readonly apiToken: string;
  private readonly config: EnhancedAIProviderConfig;
  private consecutiveFailures = 0;
  private lastLatencies: number[] = [];

  constructor(private readonly configService: ConfigService) {
    this.apiToken =
      this.configService.get<string>('PIKA_LABS_API_TOKEN') ||
      this.configService.get<string>('ai.pikaLabs.apiToken') ||
      '';
    const isConfigured =
      !!this.apiToken && !this.apiToken.includes('placeholder');
    this.config = {
      name: 'pika-labs',
      displayName: 'Pika Labs',
      enabled: isConfigured,
      priority: 2,
      capabilities: [AICapability.VIDEO],
      costPerUnitCents: { VIDEO: 10 },
      maxRetries: 3,
      timeoutMs: 120000,
      rateLimit: { maxPerMinute: 10, maxPerHour: 100 },
    };
    if (!isConfigured) {
      this.logger.debug(
        'Pika Labs provider not configured (PIKA_LABS_API_TOKEN missing). Provider will be unavailable.',
      );
    }
  }

  getName(): string {
    return 'pika-labs';
  }
  getDisplayName(): string {
    return 'Pika Labs';
  }
  getConfig(): EnhancedAIProviderConfig {
    return this.config;
  }
  getCapabilities(): AICapability[] {
    return this.config.capabilities;
  }
  supportsCapability(cap: AICapability): boolean {
    return this.config.capabilities.includes(cap);
  }

  async generate(
    _request: AIGenerationRequest,
  ): Promise<AIGenerationResponse> {
    if (!this.config.enabled) {
      this.logger.warn(
        'Pika Labs provider called but not configured. Returning graceful failure.',
      );
      return {
        success: false,
        urls: [],
        metadata: {
          provider: 'pika-labs',
          model: 'pika-1.0',
          generationTimeMs: 0,
          prompt: _request.prompt,
        },
        costs: { creditsCost: 0, realCostCents: 0 },
      };
    }

    // TODO: Implement actual Pika Labs API call when available
    // POST to video generation endpoint, poll for result
    this.logger.warn(
      'Pika Labs API integration pending. Returning graceful failure.',
    );
    return {
      success: false,
      urls: [],
      metadata: {
        provider: 'pika-labs',
        model: 'pika-1.0',
        generationTimeMs: 0,
        prompt: _request.prompt,
      },
      costs: { creditsCost: 0, realCostCents: 0 },
    };
  }

  estimateCost(
    _request: AIGenerationRequest,
  ): { credits: number; costCents: number } {
    return { credits: 10, costCents: 10 };
  }

  async isAvailable(): Promise<boolean> {
    return this.config.enabled && this.consecutiveFailures < 5;
  }

  async getHealth(): Promise<ProviderHealthInfo> {
    const avgLatency =
      this.lastLatencies.length > 0
        ? this.lastLatencies.reduce((a, b) => a + b, 0) /
          this.lastLatencies.length
        : 0;
    return {
      status: this.config.enabled
        ? ProviderStatus.HEALTHY
        : ProviderStatus.UNAVAILABLE,
      latencyMs: avgLatency,
      errorRate: 0,
      lastChecked: new Date(),
      consecutiveFailures: this.consecutiveFailures,
    };
  }
}
