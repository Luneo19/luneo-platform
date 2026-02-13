/**
 * ★★★ UTILS - PERSONNALISATION ★★★
 * Utilitaires pour la gestion des personnalisations
 * - Validation prompts
 * - Formatage texte
 * - Calcul coûts
 * - Helpers généraux
 */

import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export interface CustomizationOptions {
  font?: string;
  color?: string;
  size?: number;
  effect?: 'NORMAL' | 'EMBOSSED' | 'ENGRAVED' | 'THREE_D';
  orientation?: 'horizontal' | 'vertical' | 'curved';
}

// ========================================
// VALIDATION
// ========================================

/**
 * Valide un prompt utilisateur
 */
export function validatePrompt(
  prompt: string,
  maxLength: number = 100,
  minLength: number = 1
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!prompt || prompt.trim().length === 0) {
    errors.push('Le texte ne peut pas être vide');
  }

  if (prompt.length < minLength) {
    errors.push(`Le texte doit contenir au moins ${minLength} caractère${minLength > 1 ? 's' : ''}`);
  }

  if (prompt.length > maxLength) {
    errors.push(`Le texte ne peut pas dépasser ${maxLength} caractères`);
  }

  // Vérifie caractères interdits
  const forbiddenChars = /[<>{}[\]\\]/;
  if (forbiddenChars.test(prompt)) {
    errors.push('Le texte contient des caractères interdits');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Nettoie un prompt (supprime caractères spéciaux, trim, etc.)
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/[<>{}[\]\\]/g, '') // Supprime caractères dangereux
    .replace(/\s+/g, ' ') // Normalise espaces
    .slice(0, 500); // Limite longueur
}

// ========================================
// FORMATAGE
// ========================================

/**
 * Formate un texte pour la gravure (majuscules, etc.)
 */
export function formatForEngraving(
  text: string,
  style: 'uppercase' | 'lowercase' | 'title' | 'preserve' = 'preserve'
): string {
  switch (style) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'title':
      return text
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    default:
      return text;
  }
}

/**
 * Calcule la largeur estimée du texte en pixels
 */
export function estimateTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string = 'Arial'
): number {
  // Estimation basique (peut être améliorée avec Canvas API)
  const avgCharWidth = fontSize * 0.6;
  return text.length * avgCharWidth;
}

// ========================================
// COÛTS
// ========================================

/**
 * Calcule le coût d'une personnalisation
 */
export function calculateCustomizationCost(
  textLength: number,
  effect: CustomizationOptions['effect'] = 'ENGRAVED',
  baseCost: number = 0.5 // € par caractère de base
): number {
  let cost = textLength * baseCost;

  // Multiplicateurs selon l'effet
  const effectMultipliers: Record<string, number> = {
    NORMAL: 1.0,
    EMBOSSED: 1.2,
    ENGRAVED: 1.0,
    THREE_D: 1.5,
  };

  cost *= effectMultipliers[effect || 'ENGRAVED'] || 1.0;

  // Coût minimum
  return Math.max(cost, 1.0);
}

/**
 * Formate un prix en euros
 */
export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(price);
}

// ========================================
// HELPERS
// ========================================

/**
 * Génère un ID unique pour une personnalisation
 */
export function generateCustomizationId(): string {
  return `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Vérifie si une personnalisation est valide
 */
export function isValidCustomization(customization: {
  prompt?: string;
  zoneId?: string;
  productId?: string;
}): boolean {
  return !!(
    customization.prompt &&
    customization.zoneId &&
    customization.productId &&
    customization.prompt.trim().length > 0
  );
}

/**
 * Prépare les options de personnalisation pour l'API
 */
export function prepareCustomizationOptions(
  options: CustomizationOptions
): Record<string, unknown> {
  const prepared: Record<string, unknown> = {};

  if (options.font) prepared.font = options.font;
  if (options.color) prepared.color = options.color;
  if (options.size) prepared.size = options.size;
  if (options.effect) prepared.effect = options.effect;
  if (options.orientation) prepared.orientation = options.orientation;

  return prepared;
}

/**
 * Parse les options depuis un objet
 */
export function parseCustomizationOptions(
  options: Record<string, unknown>
): CustomizationOptions {
  return {
    font: options.font as string | undefined,
    color: options.color as string | undefined,
    size: typeof options.size === 'number' ? options.size : (options.size ? Number(options.size) : undefined),
    effect: options.effect as CustomizationOptions['effect'],
    orientation: options.orientation as CustomizationOptions['orientation'],
  };
}

// ========================================
// CACHE
// ========================================

/**
 * Génère une clé de cache pour une personnalisation
 */
export function generateCacheKey(
  prompt: string,
  options: CustomizationOptions,
  zoneId: string
): string {
  const optionsStr = JSON.stringify(options);
  const hash = `${prompt}-${optionsStr}-${zoneId}`;
  return `customization:${hash}`;
}

// ========================================
// EXPORT
// ========================================

export const customizationUtils = {
  validatePrompt,
  sanitizePrompt,
  formatForEngraving,
  estimateTextWidth,
  calculateCustomizationCost,
  formatPrice,
  generateCustomizationId,
  isValidCustomization,
  prepareCustomizationOptions,
  parseCustomizationOptions,
  generateCacheKey,
};

