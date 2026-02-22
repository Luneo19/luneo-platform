import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

interface PromptBuildParams {
  product: {
    promptTemplate?: string | null;
    negativePrompt?: string | null;
    customizationZones: Array<{
      id: string;
      name: string;
      type: string;
      renderStyle?: string;
    }>;
  };
  customizations: Record<string, unknown>;
  userPrompt?: string;
}

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async build(params: PromptBuildParams): Promise<{
    finalPrompt: string;
    negativePrompt: string;
  }> {
    const { product, customizations, userPrompt } = params;

    // Template de base du produit
    let basePrompt = product.promptTemplate || this.getDefaultTemplate(product as { name?: string });

    // Remplacer les variables par les valeurs de personnalisation
    for (const zone of product.customizationZones) {
      const customization = customizations[zone.id] as Record<string, unknown> | undefined;
      if (customization) {
        basePrompt = this.replaceVariable(basePrompt, zone, customization);
      }
    }

    // Construire le prompt final
    const finalPrompt = this.buildFinalPrompt(basePrompt, product as { name?: string; category?: string }, userPrompt);
    const negativePrompt = this.buildNegativePrompt(product);

    return { finalPrompt, negativePrompt };
  }

  private getDefaultTemplate(product: { name?: string }): string {
    return `
      A photorealistic image of a ${product.name || 'product'}.
      The product is displayed elegantly with professional studio lighting.
      {{customizations}}
      High quality, detailed, 8k resolution.
    `.trim();
  }

  private replaceVariable(template: string, zone: { name: string; type: string; renderStyle?: string }, customization: Record<string, unknown>): string {
    const placeholder = `{{${zone.name.toLowerCase().replace(/\s+/g, '_')}}}`;
    
    if (zone.type === 'TEXT') {
      const textDescription = this.describeTextCustomization(zone, customization);
      return template.replace(placeholder, textDescription);
    }

    if (zone.type === 'COLOR') {
      return template.replace(placeholder, `with ${(customization as { color?: string }).color ?? ''} color`);
    }

    return template.replace(placeholder, '');
  }

  private describeTextCustomization(zone: { name?: string; renderStyle?: string }, customization: Record<string, unknown>): string {
    const { text, font, color } = customization as { text?: string; font?: string; color?: string };
    
    if (!text) return '';

    let description = '';

    if (zone.renderStyle === 'engraved') {
      description = `with the text "${text}" elegantly engraved`;
    } else if (zone.renderStyle === 'embossed') {
      description = `with the text "${text}" beautifully embossed`;
    } else {
      description = `with the text "${text}" printed`;
    }

    if (font) description += ` in ${font} font`;
    if (color) description += ` with ${color} color`;

    return description;
  }

  private buildFinalPrompt(basePrompt: string, product: { name?: string; category?: string }, userPrompt?: string): string {
    let finalPrompt = basePrompt;

    finalPrompt = `${finalPrompt}
      Product type: ${product.category || 'jewelry'}
      Style: photorealistic, professional product photography
    `;

    if (userPrompt) {
      finalPrompt = `${finalPrompt}
        Additional customization: ${userPrompt}
      `;
    }

    return finalPrompt.replace(/\s+/g, ' ').trim();
  }

  private buildNegativePrompt(product: { negativePrompt?: string | null }): string {
    const defaultNegative = `
      blurry, low quality, distorted, deformed, ugly, 
      bad anatomy, bad proportions, extra limbs, 
      watermark, signature, text overlay, 
      oversaturated, underexposed
    `;

    return product.negativePrompt 
      ? `${product.negativePrompt}, ${defaultNegative}`
      : defaultNegative;
  }
}






