import { Injectable, Logger } from '@nestjs/common';
import { BrandGuidelinesService } from './brand-guidelines.service';

export interface EnforceStyleResult {
  enhancedPrompt: string;
  negativePrompt: string;
  appliedGuidelines: string[];
}

@Injectable()
export class StyleEnforcerService {
  private readonly logger = new Logger(StyleEnforcerService.name);

  constructor(private readonly brandGuidelines: BrandGuidelinesService) {}

  async enforceStyle(prompt: string, brandId: string): Promise<EnforceStyleResult> {
    const appliedGuidelines: string[] = [];
    let enhancedPrompt = prompt;
    let negativePrompt = '';

    try {
      const guidelines = await this.brandGuidelines.getByBrandOrNull(brandId);
      if (!guidelines) {
        return { enhancedPrompt: prompt, negativePrompt: '', appliedGuidelines: [] };
      }

      if (guidelines.promptPrefix) {
        enhancedPrompt = `${guidelines.promptPrefix} ${enhancedPrompt}`.trim();
        appliedGuidelines.push('promptPrefix');
      }
      if (guidelines.promptSuffix) {
        enhancedPrompt = `${enhancedPrompt} ${guidelines.promptSuffix}`.trim();
        appliedGuidelines.push('promptSuffix');
      }
      if (guidelines.styleKeywords?.length) {
        const keywords = (guidelines.styleKeywords as string[]).join(', ');
        enhancedPrompt = `${enhancedPrompt}, style: ${keywords}`.trim();
        appliedGuidelines.push('styleKeywords');
      }
      if (guidelines.colorPalette && Array.isArray(guidelines.colorPalette) && (guidelines.colorPalette as string[]).length) {
        const colors = (guidelines.colorPalette as string[]).join(', ');
        enhancedPrompt = `${enhancedPrompt}, colors: ${colors}`.trim();
        appliedGuidelines.push('colorPalette');
      }
      if (guidelines.negativeKeywords?.length) {
        negativePrompt = (guidelines.negativeKeywords as string[]).join(', ');
        appliedGuidelines.push('negativeKeywords');
      }

      this.logger.debug(`Enforced ${appliedGuidelines.length} guidelines for brand ${brandId}`);
    } catch (err) {
      this.logger.warn(`Could not load brand guidelines for ${brandId}, using original prompt: ${(err as Error).message}`);
    }

    return { enhancedPrompt, negativePrompt, appliedGuidelines };
  }
}
