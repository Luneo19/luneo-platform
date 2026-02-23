import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { hashPrompt, sanitizePrompt } from '@/libs/ai/ai-safety';
import { AIGenerationOptions, AIGenerationResult, AIProvider, AIProviderConfig } from '@/libs/ai/providers/ai-provider.interface';

@Injectable()
export class OpenAIProvider implements AIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;
  private readonly config: AIProviderConfig;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.openai.apiKey');
    
    // Validate API key - must be present and look like a valid OpenAI key
    const isValidApiKey = this.isValidOpenAIKey(apiKey);
    
    if (!isValidApiKey) {
      this.logger.warn(
        apiKey === 'sk-placeholder'
          ? 'OPENAI_API_KEY is a placeholder - returning mock result'
          : 'OpenAI API key not configured or invalid - provider will be disabled',
      );
    }

    // Only initialize client if we have a valid key
    this.client = new OpenAI({
      apiKey: isValidApiKey ? apiKey : 'disabled',
    });

    this.config = {
      name: 'openai',
      enabled: isValidApiKey,
      priority: 1, // Haute priorité
      costPerImageCents: 40, // ~0.40€ par image DALL-E 3 HD
      maxRetries: 3,
      timeout: 30000, // 30s
    };
  }

  /**
   * Validates if the API key looks like a valid OpenAI key
   */
  private isValidOpenAIKey(apiKey: string | undefined): boolean {
    if (!apiKey) return false;
    // OpenAI keys start with 'sk-' and are at least 40 characters
    // Reject obvious placeholders
    if (apiKey.includes('placeholder') || apiKey.includes('xxxxx') || apiKey === 'disabled') {
      return false;
    }
    return apiKey.startsWith('sk-') && apiKey.length >= 40;
  }

  getName(): string {
    return 'openai';
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  async generateImage(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const startTime = Date.now();

    try {
      // Sanitizer le prompt avec ai-safety
      const sanitized = sanitizePrompt(options.prompt, { maxLength: 1200 });
      if (sanitized.blocked) {
        throw new BadRequestException(`Prompt blocked: ${sanitized.reasons?.join(', ')}`);
      }

      const model = options.model || 'dall-e-3';
      const size = options.size || '1024x1024';
      const quality = options.quality || 'standard';

      this.logger.debug(`Generating image with OpenAI ${model}`, {
        size,
        quality,
        promptLength: sanitized.prompt.length,
        promptHash: hashPrompt(sanitized.prompt),
      });

      const response = await this.client.images.generate({
        model: model as 'dall-e-3',
        prompt: sanitized.prompt, // Utiliser le prompt sanitizé
        size: size as '1024x1024' | '1792x1024' | '1024x1792',
        quality: quality as 'hd' | 'standard',
        n: options.n || 1,
        response_format: 'url',
      });

      if (!response.data || response.data.length === 0 || !response.data[0].url) {
        throw new InternalServerErrorException('No image URL returned from OpenAI');
      }

      const imageUrl = response.data[0].url;
      const generationTime = Date.now() - startTime;

      // Télécharger l'image pour obtenir la taille
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      return {
        images: [
          {
            url: imageUrl,
            width: size === '1024x1024' ? 1024 : size === '1792x1024' ? 1792 : 1024,
            height: size === '1024x1024' ? 1024 : size === '1024x1792' ? 1792 : 1024,
            format: 'png',
            size: imageBuffer.byteLength,
          },
        ],
        metadata: {
          provider: 'openai',
          model,
          version: '1.0',
          generationTime,
          prompt: sanitized.prompt, // Stocker le prompt sanitizé
          seed: response.data[0].revised_prompt ? undefined : undefined, // OpenAI ne retourne pas de seed
        },
        costs: {
          costCents: this.estimateCost(options),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`OpenAI generation failed:`, error);
      throw new InternalServerErrorException(`OpenAI generation failed: ${errorMessage}`);
    }
  }

  estimateCost(options: AIGenerationOptions): number {
    // DALL-E 3 pricing (approximatif)
    const baseCost = options.quality === 'hd' ? 80 : 40; // cents
    return baseCost;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      // Test simple: vérifier que l'API key est valide
      // (on pourrait faire un appel test, mais c'est coûteux)
      return true;
    } catch (error) {
      this.logger.warn('OpenAI provider not available:', error);
      return false;
    }
  }

  async moderatePrompt(prompt: string): Promise<{
    isApproved: boolean;
    reason?: string;
    confidence: number;
    categories?: string[];
  }> {
    try {
      const moderation = await this.client.moderations.create({
        input: prompt,
      });

      const result = moderation.results[0];
      const flagged = result.flagged;
      const categories = Object.entries(result.categories)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

      return {
        isApproved: !flagged,
        reason: flagged ? categories.join(', ') : undefined,
        confidence: result.category_scores
          ? Math.max(...Object.values(result.category_scores as unknown as Record<string, number>))
          : 0.95,
        categories: flagged ? categories : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.warn(`OpenAI moderation failed: ${errorMessage}`);
      // En cas d'erreur, on approuve par défaut (fail-open)
      return {
        isApproved: true,
        confidence: 0.5,
      };
    }
  }
}

































