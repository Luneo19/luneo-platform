import { Injectable } from '@nestjs/common';

@Injectable()
export class UnicodeNormalizerService {
  /**
   * Normaliser un texte Unicode (NFD → NFC)
   * Évite les problèmes de caractères composés (é, è, etc.)
   */
  normalize(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Normaliser en NFC (Canonical Composition)
    // Convertit les caractères décomposés (é = e + ´) en caractères composés (é)
    return text.normalize('NFC');
  }

  /**
   * Nettoyer un texte (supprimer caractères invisibles, normaliser espaces)
   */
  clean(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let cleaned = this.normalize(text);

    // Supprimer les caractères de contrôle (sauf \n, \r, \t)
    cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Normaliser les espaces multiples en un seul espace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Trim
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Vérifier si un texte contient des caractères non-ASCII
   */
  hasNonAscii(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    // Vérifier si tous les caractères sont ASCII (0-127)
    return /[^\x00-\x7F]/.test(text);
  }

  /**
   * Extraire uniquement les caractères ASCII
   */
  extractAscii(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    return text.replace(/[^\x00-\x7F]/g, '');
  }
}










