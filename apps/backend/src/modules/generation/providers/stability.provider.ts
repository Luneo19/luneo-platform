import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIGenerationOptions, AIGenerationResult, AIProvider, AIProviderConfig } from '@/libs/ai/providers/ai-provider.interface';
import { hashPrompt, sanitizePrompt } from '@/libs/ai/ai-safety';

@Injectable()
export class StabilityProvider implements AIProvider {
  private readonly logger = new Logger(StabilityProvider.name);
  private readonly apiKey: string | null;
  private readonly config: AIProviderConfig;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.stability.apiKey');

    this.config = {
      name: 'stability',
      enabled: !!this.apiKey,
      priority: 2, // Priorité moyenne
      costPerImageCents: 25, // ~0.25€ par image SDXL
      maxRetries: 3,
      timeout: 60000, // 60s
    };
  }

  getName(): string {
    return 'stability';
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  async generateImage(options: AIGenerationOptions): Promise<AIGenerationResult> {
    if (!this.apiKey) {
      throw new Error('Stability AI API key not configured');
    }

    const startTime = Date.now();

    try {
      // Sanitizer le prompt
      const sanitized = sanitizePrompt(options.prompt, { maxLength: 1000 });
      if (sanitized.blocked) {
        throw new Error(`Prompt blocked: ${sanitized.reasons?.join(', ')}`);
      }

      const size = options.size || '1024x1024';
      const [width, height] = size.split('x').map(Number);

      this.logger.debug(`Generating image with Stability AI`, {
        size,
        promptLength: sanitized.prompt.length,
        promptHash: hashPrompt(sanitized.prompt),
      });

      // Appel à l'API Stability AI
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: sanitized.prompt,
              weight: 1,
            },
          ],
          cfg_scale: 7,
          height,
          width,
          steps: 30,
          samples: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Stability AI API error: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      const imageBase64 = result.artifacts?.[0]?.base64;

      if (!imageBase64) {
        throw new Error('No image returned from Stability AI');
      }

      // Convertir base64 en URL (on pourrait uploader vers storage)
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const imageUrl = `data:image/png;base64,${imageBase64}`; // Temporaire, devrait être uploadé

      const generationTime = Date.now() - startTime;

      return {
        images: [
          {
            url: imageUrl,
            width,
            height,
            format: 'png',
            size: imageBuffer.length,
          },
        ],
        metadata: {
          provider: 'stability',
          model: 'stable-diffusion-xl-1024-v1-0',
          version: '1.0',
          generationTime,
          prompt: sanitized.prompt,
        },
        costs: {
          costCents: this.estimateCost(options),
        },
      };
    } catch (error: any) {
      this.logger.error(`Stability AI generation failed:`, error);
      throw new Error(`Stability AI generation failed: ${error.message}`);
    }
  }

  estimateCost(options: AIGenerationOptions): number {
    // Stability AI pricing (approximatif)
    return 25; // cents
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      // Test simple: vérifier que l'API key est configurée
      return !!this.apiKey;
    } catch (error) {
      this.logger.warn('Stability AI provider not available:', error);
      return false;
    }
  }

  async moderatePrompt(prompt: string): Promise<{
    isApproved: boolean;
    reason?: string;
    confidence: number;
    categories?: string[];
  }> {
    // Stability AI n'a pas de modération intégrée
    // Utiliser la modération de base (sanitizePrompt)
    const sanitized = sanitizePrompt(prompt);
    
    return {
      isApproved: !sanitized.blocked,
      reason: sanitized.blocked ? sanitized.reasons?.join(', ') : undefined,
      confidence: sanitized.blocked ? 0.9 : 0.5,
      categories: sanitized.blocked ? sanitized.reasons : undefined,
    };
  }
}





