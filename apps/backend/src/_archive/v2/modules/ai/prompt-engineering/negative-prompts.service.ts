import { Injectable, Logger } from '@nestjs/common';

const NEGATIVE_PROMPTS_BY_INDUSTRY: Record<string, string[]> = {
  jewelry: [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'ugly',
    'bad anatomy',
    'watermark',
    'text',
    'signature',
    'dull',
    'flat lighting',
    'oversaturated',
    'plastic look',
    'fake gemstones',
    'crooked setting',
    'dust',
    'scratches',
    'reflection artifacts',
  ],
  fashion: [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'ugly',
    'bad anatomy',
    'watermark',
    'text',
    'wrinkled fabric',
    'stains',
    'poor stitching',
    'flat lighting',
    'oversaturated',
    'mannequin look',
    'plastic skin',
    'weird proportions',
    'extra limbs',
  ],
  watches: [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'watermark',
    'text',
    'wrong time display',
    'broken hands',
    'scratched crystal',
    'dust',
    'reflection artifacts',
    'plastic look',
    'fake metal',
    'oversaturated',
    'flat lighting',
  ],
  cosmetics: [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'ugly',
    'bad anatomy',
    'watermark',
    'text',
    'messy',
    'spills',
    'fingerprints',
    'dust',
    'flat lighting',
    'oversaturated',
    'plastic look',
    'weird skin texture',
    'unrealistic product',
  ],
  electronics: [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'watermark',
    'text',
    'broken screen',
    'scratches',
    'fingerprints',
    'dust',
    'reflection artifacts',
    'wrong proportions',
    'fake materials',
    'oversaturated',
    'flat lighting',
  ],
  automotive: [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'watermark',
    'text',
    'scratches',
    'dents',
    'dust',
    'bad reflections',
    'wrong proportions',
    'plastic look',
    'oversaturated',
    'flat lighting',
    'weird wheels',
  ],
  food: [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'ugly',
    'watermark',
    'text',
    'rotten',
    'moldy',
    'unappetizing',
    'flat lighting',
    'oversaturated',
    'plastic look',
    'fake food',
    'weird colors',
    'messy plating',
  ],
  'real-estate': [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'watermark',
    'text',
    'empty rooms',
    'poor lighting',
    'cluttered',
    'dust',
    'reflection artifacts',
    'wrong proportions',
    'oversaturated',
    'flat lighting',
    'unrealistic furniture',
    'weird perspective',
  ],
};

const DEFAULT_NEGATIVES = [
  'blurry',
  'low quality',
  'distorted',
  'deformed',
  'ugly',
  'bad anatomy',
  'watermark',
  'text',
  'signature',
];

@Injectable()
export class NegativePromptsService {
  private readonly logger = new Logger(NegativePromptsService.name);

  /**
   * Returns a combined negative prompt string for the given industry,
   * optionally merged with additional negative keywords.
   */
  getNegativePrompts(industry: string, additionalNegatives?: string[]): string {
    const normalizedIndustry = industry.toLowerCase().replace(/\s+/g, '-');
    const industryNegatives =
      NEGATIVE_PROMPTS_BY_INDUSTRY[normalizedIndustry] ?? DEFAULT_NEGATIVES;

    const combined = new Set<string>([...industryNegatives]);
    if (additionalNegatives?.length) {
      additionalNegatives.forEach((n) => combined.add(n.trim().toLowerCase()));
    }

    const result = Array.from(combined).filter(Boolean).join(', ');
    this.logger.debug(`getNegativePrompts(industry=${industry}) -> ${combined.size} terms`);
    return result;
  }

  /**
   * Returns the raw array of negative prompts for an industry (no additional terms).
   */
  getNegativePromptList(industry: string): string[] {
    const normalizedIndustry = industry.toLowerCase().replace(/\s+/g, '-');
    return (
      NEGATIVE_PROMPTS_BY_INDUSTRY[normalizedIndustry] ?? [...DEFAULT_NEGATIVES]
    );
  }

  /**
   * Returns all supported industry slugs.
   */
  getSupportedIndustries(): string[] {
    return Object.keys(NEGATIVE_PROMPTS_BY_INDUSTRY);
  }
}
