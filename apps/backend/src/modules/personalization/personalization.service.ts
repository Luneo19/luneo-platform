import { BadRequestException, Injectable } from '@nestjs/common';
import { RulesEngineService } from './services/rules-engine.service';
import { UnicodeNormalizerService } from './services/unicode-normalizer.service';
import { TextValidatorService } from './services/text-validator.service';
import { AutoFitService } from './services/auto-fit.service';
import { ValidateZoneInputDto } from './dto/validate-zone-input.dto';
import { NormalizeTextDto } from './dto/normalize-text.dto';
import { AutoFitDto } from './dto/auto-fit.dto';

@Injectable()
export class PersonalizationService {
  constructor(
    private rulesEngine: RulesEngineService,
    private unicodeNormalizer: UnicodeNormalizerService,
    private textValidator: TextValidatorService,
    private autoFit: AutoFitService,
  ) {}

  /**
   * Valider des inputs de zones
   */
  async validateZoneInputs(dto: ValidateZoneInputDto) {
    // 1. Normaliser tous les textes
    const normalizedInputs: Record<string, any> = {};
    for (const [zoneId, input] of Object.entries(dto.zoneInputs)) {
      if (input.text) {
        normalizedInputs[zoneId] = {
          ...input,
          text: this.unicodeNormalizer.normalize(input.text),
        };
      } else {
        normalizedInputs[zoneId] = input;
      }
    }

    // 2. Appliquer les defaults
    const withDefaults = await this.rulesEngine.applyDefaults(
      dto.productId,
      normalizedInputs,
    );

    // 3. Valider contre les règles
    const validation = await this.rulesEngine.validateZoneInputs(
      dto.productId,
      withDefaults,
    );

    return {
      ...validation,
      normalizedInputs: withDefaults,
    };
  }

  /**
   * Normaliser un texte
   */
  normalizeText(dto: NormalizeTextDto) {
    const normalized = this.unicodeNormalizer.normalize(dto.text);
    const cleaned = dto.clean ? this.unicodeNormalizer.clean(dto.text) : normalized;

    return {
      original: dto.text,
      normalized,
      cleaned: dto.clean ? cleaned : undefined,
      hasNonAscii: this.unicodeNormalizer.hasNonAscii(normalized),
    };
  }

  /**
   * Calculer auto-fit
   */
  calculateAutoFit(dto: AutoFitDto) {
    if (dto.type === 'text') {
      return this.autoFit.calculateFontSize(
        dto.text || '',
        dto.maxWidth,
        dto.maxHeight,
        dto.fontFamily,
        dto.minFontSize,
        dto.maxFontSize,
      );
    } else if (dto.type === 'image' || dto.type === 'pattern') {
      return this.autoFit.calculateScale(
        dto.elementWidth || 100,
        dto.elementHeight || 100,
        dto.maxWidth,
        dto.maxHeight,
        dto.maintainAspectRatio !== false,
      );
    }

    throw new BadRequestException(`Unsupported auto-fit type: ${dto.type}`);
  }
}











