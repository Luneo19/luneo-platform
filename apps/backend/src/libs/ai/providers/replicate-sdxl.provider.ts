import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Optional: Replicate SDK (install with: npm install replicate)
let Replicate: any;
try {
  Replicate = require('replicate').default || require('replicate');
} catch (e) {
  // Replicate not installed
}
// @ts-ignore - Package local
import { hashPrompt, sanitizePrompt } from '../ai-safety';
import { AIGenerationOptions, AIGenerationResult, AIProvider, AIProviderConfig } from './ai-provider.interface';

@Injectable()
export class ReplicateSDXLProvider implements AIProvider {
  private readonly logger = new Logger(ReplicateSDXLProvider.name);
  private readonly client: any | null;
  private readonly config: AIProviderConfig;

  constructor(private readonly configService: ConfigService) {
    const apiToken = this.configService.get<string>('ai.replicate.apiToken');

    if (apiToken && Replicate) {
      this.client = new Replicate({
        auth: apiToken,
      });
    } else {
      this.client = null;
      if (!Replicate) {
        this.logger.warn('Replicate SDK not installed. Install with: npm install replicate');
      } else {
        this.logger.warn('Replicate API token not configured');
      }
    }

    this.config = {
      name: 'replicate-sdxl',
      enabled: !!apiToken,
      priority: 2, // Priorité moyenne (fallback)
      costPerImageCents: 20, // ~0.20€ par image SDXL (moins cher que DALL-E)
      maxRetries: 3,
      timeout: 60000, // 60s (SDXL peut être plus lent)
    };
  }

  getName(): string {
    return 'replicate-sdxl';
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  async generateImage(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const startTime = Date.now();

    if (!this.client) {
      throw new Error('Replicate client not initialized');
    }

    try {
      // Sanitizer le prompt avec ai-safety
      const sanitized = sanitizePrompt(options.prompt, { maxLength: 1000 });
      if (sanitized.blocked) {
        throw new Error(`Prompt blocked: ${sanitized.reasons?.join(', ')}`);
      }

      this.logger.debug(`Generating image with Replicate SDXL`, {
        promptLength: sanitized.prompt.length,
        promptHash: hashPrompt(sanitized.prompt),
      });

      // SDXL model sur Replicate
      const model = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

      const output = await this.client.run(model as any, {
        input: {
          prompt: sanitized.prompt, // Utiliser le prompt sanitizé
          width: this.parseSize(options.size || '1024x1024').width,
          height: this.parseSize(options.size || '1024x1024').height,
          num_outputs: options.n || 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      });

      if (!output || (Array.isArray(output) && output.length === 0)) {
        throw new Error('No image returned from Replicate');
      }

      const imageUrl = Array.isArray(output) ? output[0] : output;
      const generationTime = Date.now() - startTime;

      // Télécharger l'image pour obtenir la taille
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      return {
        images: [
          {
            url: imageUrl,
            width: this.parseSize(options.size || '1024x1024').width,
            height: this.parseSize(options.size || '1024x1024').height,
            format: 'png',
            size: imageBuffer.byteLength,
          },
        ],
        metadata: {
          provider: 'replicate',
          model: 'sdxl',
          version: '1.0',
          generationTime,
          prompt: sanitized.prompt, // Stocker le prompt sanitizé
        },
        costs: {
          costCents: this.estimateCost(options),
        },
      };
    } catch (error) {
      this.logger.error(`Replicate SDXL generation failed:`, error);
      throw new Error(`Replicate SDXL generation failed: ${error.message}`);
    }
  }

  estimateCost(options: AIGenerationOptions): number {
    // SDXL sur Replicate: ~0.20€ par image
    return 20; // cents
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled || !this.client) {
      return false;
    }

    try {
      // Test simple: vérifier que le client est initialisé
      return true;
    } catch (error) {
      this.logger.warn('Replicate SDXL provider not available:', error);
      return false;
    }
  }

  async moderatePrompt(prompt: string): Promise<{
    isApproved: boolean;
    reason?: string;
    confidence: number;
    categories?: string[];
  }> {
    // Replicate n'a pas d'API de modération intégrée
    // On retourne approuvé par défaut (la modération sera faite par OpenAI ou autre)
    return {
      isApproved: true,
      confidence: 0.7, // Confiance moyenne (pas de modération native)
    };
  }

  private parseSize(size: string): { width: number; height: number } {
    const [width, height] = size.split('x').map(Number);
    return { width, height };
  }
}

































