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

@Injectable()
export class ReplicateSDXLProvider implements EnhancedAIProvider {
  private readonly logger = new Logger(ReplicateSDXLProvider.name);
  private readonly apiToken: string;
  private readonly config: EnhancedAIProviderConfig;
  private consecutiveFailures = 0;
  private lastLatencies: number[] = [];

  constructor(private readonly configService: ConfigService) {
    this.apiToken =
      this.configService.get<string>('REPLICATE_API_TOKEN') ||
      this.configService.get<string>('ai.replicate.apiToken') ||
      '';
    this.config = {
      name: 'replicate-sdxl',
      displayName: 'Replicate SDXL',
      enabled: !!this.apiToken && !this.apiToken.includes('placeholder'),
      priority: 2,
      capabilities: [AICapability.IMAGE_2D, AICapability.IMAGE_HD],
      costPerUnitCents: { IMAGE_2D: 2, IMAGE_HD: 3 },
      maxRetries: 3,
      timeoutMs: 60000,
      rateLimit: { maxPerMinute: 30, maxPerHour: 500 },
    };
  }

  getName(): string {
    return 'replicate-sdxl';
  }
  getDisplayName(): string {
    return 'Replicate SDXL';
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

  async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version:
            'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
          input: {
            prompt: request.prompt,
            negative_prompt:
              request.negativePrompt || 'blurry, low quality, distorted',
            width: request.parameters?.width || 1024,
            height: request.parameters?.height || 1024,
            num_outputs: 1,
            guidance_scale: request.parameters?.guidanceScale || 7.5,
            num_inference_steps: request.quality === 'hd' ? 50 : 30,
          },
        }),
      });

      if (!response.ok)
        throw new Error(`Replicate API error: ${response.status}`);
      let prediction = await response.json();

      // Poll for result
      let attempts = 0;
      while (
        (prediction.status === 'starting' ||
          prediction.status === 'processing') &&
        attempts < 60
      ) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(prediction.urls.get, {
          headers: { Authorization: `Token ${this.apiToken}` },
        });
        prediction = await statusRes.json();
        attempts++;
      }

      if (prediction.status !== 'succeeded' || !prediction.output?.length) {
        throw new Error(
          `Replicate prediction failed: ${prediction.error || 'Unknown error'}`,
        );
      }

      const generationTimeMs = Date.now() - startTime;
      this.consecutiveFailures = 0;
      this.lastLatencies.push(generationTimeMs);
      if (this.lastLatencies.length > 20) this.lastLatencies.shift();

      const estimate = this.estimateCost(request);
      return {
        success: true,
        urls: Array.isArray(prediction.output)
          ? prediction.output
          : [prediction.output],
        metadata: {
          provider: 'replicate-sdxl',
          model: 'sdxl-1.0',
          generationTimeMs,
          prompt: request.prompt,
          width: (request.parameters?.width as number) || 1024,
          height: (request.parameters?.height as number) || 1024,
        },
        costs: {
          creditsCost: estimate.credits,
          realCostCents: estimate.costCents,
        },
      };
    } catch (error) {
      this.consecutiveFailures++;
      throw error;
    }
  }

  estimateCost(request: AIGenerationRequest): {
    credits: number;
    costCents: number;
  } {
    const isHd = request.quality === 'hd';
    return { credits: isHd ? 3 : 2, costCents: isHd ? 3 : 2 };
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
      status:
        this.consecutiveFailures >= 5
          ? ProviderStatus.UNAVAILABLE
          : this.consecutiveFailures >= 2
            ? ProviderStatus.DEGRADED
            : ProviderStatus.HEALTHY,
      latencyMs: avgLatency,
      errorRate:
        this.consecutiveFailures /
        Math.max(
          1,
          this.lastLatencies.length + this.consecutiveFailures,
        ),
      lastChecked: new Date(),
      consecutiveFailures: this.consecutiveFailures,
    };
  }
}
