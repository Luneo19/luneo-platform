import { Injectable, Logger } from '@nestjs/common';

export interface StylePresetParams {
  /** Suggested CFG scale for diffusion models */
  cfgScale?: number;
  /** Suggested steps */
  steps?: number;
  /** Suggested sampler if applicable */
  sampler?: string;
  /** Additional model hints */
  modelHint?: string;
}

export interface StylePreset {
  name: string;
  description: string;
  keywords: string[];
  negativeKeywords: string[];
  params: StylePresetParams;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    name: 'luxury',
    description: 'High-end, premium product photography with rich tones and refined lighting',
    keywords: [
      'luxury',
      'premium',
      'elegant',
      'sophisticated',
      'refined',
      'high-end',
      'soft studio lighting',
      'subtle shadows',
      'rich tones',
      'minimal backdrop',
    ],
    negativeKeywords: [
      'cheap',
      'plastic',
      'flat',
      'harsh lighting',
      'cluttered',
      'amateur',
    ],
    params: { cfgScale: 7.5, steps: 30, modelHint: 'dall-e-3' },
  },
  {
    name: 'minimalist',
    description: 'Clean, simple compositions with plenty of negative space',
    keywords: [
      'minimalist',
      'clean',
      'simple',
      'white background',
      'negative space',
      'soft shadows',
      'neutral tones',
      'uncluttered',
    ],
    negativeKeywords: [
      'cluttered',
      'busy',
      'complex',
      'oversaturated',
      'distracting',
    ],
    params: { cfgScale: 7, steps: 28, modelHint: 'dall-e-3' },
  },
  {
    name: 'vintage',
    description: 'Warm, nostalgic aesthetic with film-like tones',
    keywords: [
      'vintage',
      'retro',
      'film grain',
      'warm tones',
      'nostalgic',
      'soft focus',
      'muted colors',
      'classic',
    ],
    negativeKeywords: [
      'modern',
      'digital',
      'oversaturated',
      'harsh',
      'cold',
    ],
    params: { cfgScale: 7.5, steps: 32, modelHint: 'sdxl' },
  },
  {
    name: 'modern',
    description: 'Contemporary, sharp product shots with clear geometry',
    keywords: [
      'modern',
      'contemporary',
      'sharp',
      'clean lines',
      'geometric',
      'professional lighting',
      'high contrast',
      'sleek',
    ],
    negativeKeywords: [
      'vintage',
      'blurry',
      'soft',
      'cluttered',
      'outdated',
    ],
    params: { cfgScale: 7.5, steps: 30, modelHint: 'dall-e-3' },
  },
  {
    name: 'editorial',
    description: 'Magazine-style, dramatic lighting and strong composition',
    keywords: [
      'editorial',
      'magazine style',
      'dramatic lighting',
      'strong composition',
      'fashion photography',
      'professional',
      'stylized',
    ],
    negativeKeywords: [
      'amateur',
      'flat',
      'boring',
      'snapshot',
    ],
    params: { cfgScale: 8, steps: 35, modelHint: 'sdxl' },
  },
  {
    name: 'natural',
    description: 'Organic, lifestyle context with natural light',
    keywords: [
      'natural light',
      'organic',
      'lifestyle',
      'authentic',
      'warm',
      'soft',
      'environmental',
    ],
    negativeKeywords: [
      'studio only',
      'harsh',
      'artificial',
      'cold',
    ],
    params: { cfgScale: 7, steps: 28, modelHint: 'sdxl' },
  },
  {
    name: 'dark-mood',
    description: 'Moody, dark backgrounds with accent lighting',
    keywords: [
      'dark background',
      'moody',
      'dramatic',
      'accent lighting',
      'rim light',
      'mysterious',
      'high contrast',
    ],
    negativeKeywords: [
      'bright',
      'flat',
      'washed out',
      'cheerful',
    ],
    params: { cfgScale: 8, steps: 32, modelHint: 'sdxl' },
  },
  {
    name: 'artistic',
    description: 'Creative, conceptual product imagery',
    keywords: [
      'artistic',
      'creative',
      'conceptual',
      'stylized',
      'unique composition',
      'creative lighting',
    ],
    negativeKeywords: [
      'generic',
      'boring',
      'stock photo',
    ],
    params: { cfgScale: 8.5, steps: 35, modelHint: 'dall-e-3' },
  },
];

@Injectable()
export class StylePresetsService {
  private readonly logger = new Logger(StylePresetsService.name);
  private readonly presetsByName = new Map<string, StylePreset>(
    STYLE_PRESETS.map((p) => [p.name.toLowerCase(), p]),
  );

  /**
   * Returns a style preset by name (case-insensitive).
   */
  getPreset(name: string): StylePreset | null {
    const normalized = name.toLowerCase().trim();
    const preset = this.presetsByName.get(normalized) ?? null;
    if (!preset) {
      this.logger.debug(`getPreset("${name}") not found`);
    }
    return preset;
  }

  /**
   * Returns all available style presets.
   */
  getAllPresets(): StylePreset[] {
    return [...STYLE_PRESETS];
  }

  /**
   * Returns preset keywords as a single string for appending to a prompt.
   */
  getPresetKeywordsString(name: string): string {
    const preset = this.getPreset(name);
    return preset ? preset.keywords.join(', ') : '';
  }

  /**
   * Returns preset negative keywords as a single string.
   */
  getPresetNegativeKeywordsString(name: string): string {
    const preset = this.getPreset(name);
    return preset ? preset.negativeKeywords.join(', ') : '';
  }
}
