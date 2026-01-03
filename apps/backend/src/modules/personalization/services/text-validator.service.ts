import { Injectable } from '@nestjs/common';
import { UnicodeNormalizerService } from './unicode-normalizer.service';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalizedText?: string;
}

@Injectable()
export class TextValidatorService {
  constructor(private unicodeNormalizer: UnicodeNormalizerService) {}

  /**
   * Valider un texte selon les contraintes d'une zone
   */
  validate(
    text: string,
    constraints: {
      maxChars?: number;
      minChars?: number;
      allowedChars?: string; // Regex pattern
      forbiddenChars?: string; // Regex pattern
      required?: boolean;
      allowNonAscii?: boolean;
    },
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Normaliser le texte
    const normalizedText = this.unicodeNormalizer.normalize(text);

    // Vérifier si requis
    if (constraints.required && (!normalizedText || normalizedText.trim().length === 0)) {
      errors.push('Text is required');
      return { valid: false, errors, warnings, normalizedText };
    }

    // Si texte vide et non requis, OK
    if (!normalizedText || normalizedText.trim().length === 0) {
      return { valid: true, errors: [], warnings: [], normalizedText: '' };
    }

    // Vérifier longueur min
    if (constraints.minChars && normalizedText.length < constraints.minChars) {
      errors.push(`Text must be at least ${constraints.minChars} characters`);
    }

    // Vérifier longueur max
    if (constraints.maxChars && normalizedText.length > constraints.maxChars) {
      errors.push(`Text must not exceed ${constraints.maxChars} characters`);
    }

    // Vérifier caractères autorisés
    if (constraints.allowedChars) {
      const allowedPattern = new RegExp(`^[${constraints.allowedChars}]+$`);
      if (!allowedPattern.test(normalizedText)) {
        errors.push(`Text contains invalid characters. Allowed: ${constraints.allowedChars}`);
      }
    }

    // Vérifier caractères interdits
    if (constraints.forbiddenChars) {
      const forbiddenPattern = new RegExp(constraints.forbiddenChars);
      if (forbiddenPattern.test(normalizedText)) {
        errors.push(`Text contains forbidden characters: ${constraints.forbiddenChars}`);
      }
    }

    // Vérifier non-ASCII
    if (!constraints.allowNonAscii && this.unicodeNormalizer.hasNonAscii(normalizedText)) {
      warnings.push('Text contains non-ASCII characters. Some fonts may not support them.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      normalizedText,
    };
  }

  /**
   * Valider un texte pour une zone spécifique
   */
  async validateForZone(
    text: string,
    zoneId: string,
    productId: string,
  ): Promise<ValidationResult> {
    // Récupérer les contraintes de la zone depuis la DB
    // Pour l'instant, validation basique
    // TODO: Récupérer depuis Prisma

    return this.validate(text, {
      maxChars: 50, // Par défaut
      minChars: 1,
      required: false,
      allowNonAscii: true,
    });
  }
}






