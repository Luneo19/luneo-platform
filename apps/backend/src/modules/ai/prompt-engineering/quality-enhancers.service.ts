import { Injectable, Logger } from '@nestjs/common';

export type QualityLevel = 'standard' | 'hd' | 'ultra';

const QUALITY_KEYWORDS: Record<QualityLevel, string[]> = {
  standard: [
    'professional photography',
    'studio lighting',
    'sharp focus',
    'high detail',
    'clean composition',
  ],
  hd: [
    'professional photography',
    'studio lighting',
    'sharp focus',
    'high detail',
    '8k resolution',
    'ultra-detailed',
    'photorealistic',
    'clean composition',
  ],
  ultra: [
    'professional photography',
    'studio lighting',
    'sharp focus',
    'high detail',
    '8k resolution',
    'ultra-detailed',
    'photorealistic',
    'hyperrealistic',
    'masterpiece',
    'best quality',
    'clean composition',
    'perfect lighting',
  ],
};

@Injectable()
export class QualityEnhancersService {
  private readonly logger = new Logger(QualityEnhancersService.name);

  /**
   * Appends quality-enhancing keywords to the prompt based on the target quality level.
   */
  enhance(prompt: string, quality: QualityLevel = 'standard'): string {
    const keywords = QUALITY_KEYWORDS[quality] ?? QUALITY_KEYWORDS.standard;
    const suffix = keywords.join(', ');
    const enhanced = prompt.trim().endsWith(',')
      ? `${prompt.trim()} ${suffix}`
      : `${prompt.trim()}, ${suffix}`;
    this.logger.debug(`enhance(quality=${quality}) added ${keywords.length} keywords`);
    return enhanced;
  }

  /**
   * Returns only the quality keywords for a level (e.g. for merging elsewhere).
   */
  getQualityKeywords(quality: QualityLevel): string[] {
    return [...(QUALITY_KEYWORDS[quality] ?? QUALITY_KEYWORDS.standard)];
  }
}
