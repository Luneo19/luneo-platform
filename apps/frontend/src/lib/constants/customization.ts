/**
 * ★★★ CONSTANTES - PERSONNALISATION ★★★
 * Constantes pour le système de personnalisation
 * - Limites
 * - Options par défaut
 * - Messages
 * - Configurations
 */

// ========================================
// LIMITES
// ========================================

export const CUSTOMIZATION_LIMITS = {
  PROMPT_MIN_LENGTH: 1,
  PROMPT_MAX_LENGTH: 500,
  PROMPT_DEFAULT_MAX_LENGTH: 100,
  FONT_SIZE_MIN: 8,
  FONT_SIZE_MAX: 72,
  FONT_SIZE_DEFAULT: 24,
  COLOR_DEFAULT: '#000000',
  EFFECT_DEFAULT: 'ENGRAVED' as const,
  ORIENTATION_DEFAULT: 'horizontal' as const,
} as const;

// ========================================
// POLICES DISPONIBLES
// ========================================

export const AVAILABLE_FONTS = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Helvetica',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Palatino',
] as const;

export const DEFAULT_FONT = 'Arial';

// ========================================
// COULEURS DISPONIBLES
// ========================================

export const AVAILABLE_COLORS = [
  '#000000', // Noir
  '#FFFFFF', // Blanc
  '#C0C0C0', // Argent
  '#FFD700', // Or
  '#FF0000', // Rouge
  '#0000FF', // Bleu
  '#008000', // Vert
  '#800080', // Violet
] as const;

export const DEFAULT_COLOR = '#000000';

// ========================================
// EFFETS DISPONIBLES
// ========================================

export const AVAILABLE_EFFECTS = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'EMBOSSED', label: 'Relief' },
  { value: 'ENGRAVED', label: 'Gravé' },
  { value: 'THREE_D', label: '3D' },
] as const;

// ========================================
// ORIENTATIONS DISPONIBLES
// ========================================

export const AVAILABLE_ORIENTATIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'curved', label: 'Courbe' },
] as const;

// ========================================
// COÛTS
// ========================================

export const CUSTOMIZATION_COSTS = {
  BASE_COST_PER_CHAR: 0.5, // €
  EFFECT_MULTIPLIERS: {
    NORMAL: 1.0,
    EMBOSSED: 1.2,
    ENGRAVED: 1.0,
    THREE_D: 1.5,
  },
  MIN_COST: 1.0, // €
  CURRENCY: 'EUR',
} as const;

// ========================================
// MESSAGES
// ========================================

export const CUSTOMIZATION_MESSAGES = {
  GENERATING: 'Génération en cours...',
  COMPLETED: 'Génération terminée avec succès !',
  FAILED: 'Erreur lors de la génération',
  INVALID_PROMPT: 'Le texte saisi est invalide',
  PROMPT_TOO_LONG: 'Le texte est trop long',
  PROMPT_TOO_SHORT: 'Le texte est trop court',
  PROMPT_EMPTY: 'Le texte ne peut pas être vide',
  FORBIDDEN_CHARS: 'Le texte contient des caractères interdits',
  ZONE_NOT_FOUND: 'Zone introuvable',
  PRODUCT_NOT_FOUND: 'Produit introuvable',
  GENERATION_TIMEOUT: 'La génération a pris trop de temps',
} as const;

// ========================================
// CONFIGURATIONS
// ========================================

export const CUSTOMIZATION_CONFIG = {
  POLL_INTERVAL: 2000, // ms
  MAX_POLL_ATTEMPTS: 150, // 5 minutes max
  CACHE_TTL: 3600, // 1 heure
  RETRY_DELAY: 1000, // ms
  MAX_RETRIES: 3,
} as const;

// ========================================
// VALIDATION REGEX
// ========================================

export const VALIDATION_PATTERNS = {
  FORBIDDEN_CHARS: /[<>{}[\]\\]/,
  COLOR_HEX: /^#[0-9A-Fa-f]{6}$/,
  FONT_NAME: /^[a-zA-Z0-9\s-]+$/,
} as const;

// ========================================
// EXPORT
// ========================================

export const customizationConstants = {
  LIMITS: CUSTOMIZATION_LIMITS,
  FONTS: AVAILABLE_FONTS,
  COLORS: AVAILABLE_COLORS,
  EFFECTS: AVAILABLE_EFFECTS,
  ORIENTATIONS: AVAILABLE_ORIENTATIONS,
  COSTS: CUSTOMIZATION_COSTS,
  MESSAGES: CUSTOMIZATION_MESSAGES,
  CONFIG: CUSTOMIZATION_CONFIG,
  VALIDATION: VALIDATION_PATTERNS,
} as const;

