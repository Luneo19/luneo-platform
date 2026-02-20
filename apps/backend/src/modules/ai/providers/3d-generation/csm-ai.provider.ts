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
 * CSM AI 3D model generation provider.
 * Activates automatically when CSM_AI_API_TOKEN is set.
 * Falls back gracefully when not configured.
 */
@Injectable()
export class CSMAIProvider implements EnhancedAIProvider {
  private readonly logger = new Logger(CSMAIProvider.name);
  private readonly apiToken: string;
  private readonly config: EnhancedAIProviderConfig;
  private consecutiveFailures = 0;
  private lastLatencies: number[] = [];

  constructor(private readonly configService: ConfigService) {
    this.apiToken =
      this.configService.get<string>('CSM_AI_API_TOKEN') ||
      this.configService.get<string>('ai.csmAi.apiToken') ||
      '';
    const isConfigured =
      !!this.apiToken && !this.apiToken.includes('placeholder');
    this.config = {
      name: 'csm-ai',
      displayName: 'CSM AI',
      enabled: isConfigured,
      priority: 2,
      capabilities: [AICapability.MODEL_3D],
      costPerUnitCents: { MODEL_3D: 15 },
      maxRetries: 3,
      timeoutMs: 180000,
      rateLimit: { maxPerMinute: 5, maxPerHour: 50 },
    };
    if (!isConfigured) {
      this.logger.debug(
        'CSM AI provider not configured (CSM_AI_API_TOKEN missing). Provider will be unavailable.',
      );
    }
  }

  getName(): string {
    return 'csm-ai';
  }
  getDisplayName(): string {
    return 'CSM AI';
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
        'CSM AI provider called but not configured. Returning graceful failure.',
      );
      return {
        success: false,
        urls: [],
        metadata: {
          provider: 'csm-ai',
          model: 'csm-v1',
          generationTimeMs: 0,
          prompt: _request.prompt,
        },
        costs: { creditsCost: 0, realCostCents: 0 },
      };
    }

    // TODO: Implement actual CSM AI API call when available
    // Submit 3D generation job, poll for mesh/GLB URL
    this.logger.warn(
      'CSM AI API integration pending. Returning graceful failure.',
    );
    return {
      success: false,
      urls: [],
      metadata: {
        provider: 'csm-ai',
        model: 'csm-v1',
        generationTimeMs: 0,
        prompt: _request.prompt,
      },
      costs: { creditsCost: 0, realCostCents: 0 },
    };
  }

  estimateCost(
    _request: AIGenerationRequest,
  ): { credits: number; costCents: number } {
    return { credits: 15, costCents: 15 };
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
