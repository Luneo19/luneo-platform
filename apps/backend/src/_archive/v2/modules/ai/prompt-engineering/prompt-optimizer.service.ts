import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PromptOptimizationResult {
  optimizedPrompt: string;
  negativePrompt: string;
  qualityKeywords: string[];
  styleKeywords: string[];
  suggestedModel: string;
  confidence: number;
}

export interface PromptOptimizationContext {
  industry?: string;
  style?: string;
  quality?: 'standard' | 'hd';
  brandGuidelines?: {
    styleKeywords: string[];
    negativeKeywords: string[];
    promptPrefix?: string;
    promptSuffix?: string;
  };
}

@Injectable()
export class PromptOptimizerService {
  private readonly logger = new Logger(PromptOptimizerService.name);
  private readonly openaiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.openaiApiKey =
      this.configService.get<string>('ai.openai.apiKey') ||
      this.configService.get<string>('OPENAI_API_KEY') ||
      '';
  }

  async optimize(
    prompt: string,
    context?: PromptOptimizationContext,
  ): Promise<PromptOptimizationResult> {
    if (!this.openaiApiKey || this.openaiApiKey.includes('placeholder')) {
      return this.fallbackOptimize(prompt, context);
    }

    try {
      const systemPrompt = `You are an expert AI image prompt engineer for product photography and luxury brand visuals.
Given a user prompt, optimize it for the best image generation results.
Return a JSON object with:
- optimizedPrompt: Enhanced prompt with professional photography terms
- negativePrompt: Things to avoid in the generation
- qualityKeywords: Array of quality-enhancing keywords added
- styleKeywords: Array of style keywords used
- suggestedModel: "dall-e-3" for creative, "sdxl" for photorealistic, "stability" for detailed
- confidence: 0-1 how confident you are in the optimization

${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.style ? `Preferred style: ${context.style}` : ''}
${context?.brandGuidelines?.styleKeywords?.length ? `Brand style: ${context.brandGuidelines.styleKeywords.join(', ')}` : ''}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Optimize this prompt: "${prompt}"` },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // Apply brand guidelines prefix/suffix if present
      let finalPrompt = result.optimizedPrompt;
      if (context?.brandGuidelines?.promptPrefix) {
        finalPrompt = `${context.brandGuidelines.promptPrefix} ${finalPrompt}`;
      }
      if (context?.brandGuidelines?.promptSuffix) {
        finalPrompt = `${finalPrompt} ${context.brandGuidelines.promptSuffix}`;
      }

      return {
        optimizedPrompt: finalPrompt,
        negativePrompt: result.negativePrompt || '',
        qualityKeywords: result.qualityKeywords || [],
        styleKeywords: result.styleKeywords || [],
        suggestedModel: result.suggestedModel || 'dall-e-3',
        confidence: result.confidence ?? 0.8,
      };
    } catch (error) {
      this.logger.warn('Prompt optimization via GPT-4o-mini failed, using fallback', {
        error: error instanceof Error ? error.message : error,
      });
      return this.fallbackOptimize(prompt, context);
    }
  }

  private fallbackOptimize(
    prompt: string,
    context?: PromptOptimizationContext,
  ): PromptOptimizationResult {
    const qualityKeywords = [
      'professional photography',
      'studio lighting',
      'sharp focus',
      'high detail',
    ];
    if (context?.quality === 'hd') {
      qualityKeywords.push('8k resolution', 'ultra-detailed', 'photorealistic');
    }

    const styleKeywords: string[] = [];
    if (context?.style) {
      styleKeywords.push(context.style);
    }
    if (context?.industry === 'jewelry') {
      styleKeywords.push('luxury', 'elegant', 'premium');
      qualityKeywords.push('macro photography', 'reflection', 'sparkle');
    }

    let optimizedPrompt = `${prompt}, ${qualityKeywords.join(', ')}`;
    if (styleKeywords.length > 0) {
      optimizedPrompt += `, ${styleKeywords.join(', ')}`;
    }

    if (context?.brandGuidelines?.promptPrefix) {
      optimizedPrompt = `${context.brandGuidelines.promptPrefix} ${optimizedPrompt}`;
    }
    if (context?.brandGuidelines?.promptSuffix) {
      optimizedPrompt = `${optimizedPrompt} ${context.brandGuidelines.promptSuffix}`;
    }

    return {
      optimizedPrompt,
      negativePrompt:
        'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, signature',
      qualityKeywords,
      styleKeywords,
      suggestedModel: 'dall-e-3',
      confidence: 0.6,
    };
  }
}
