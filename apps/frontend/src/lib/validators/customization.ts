/**
 * ★★★ VALIDATORS - PERSONNALISATION ★★★
 * Validators Zod complets pour la personnalisation
 * - Validation prompts
 * - Validation zones
 * - Validation options
 * - Messages d'erreur personnalisés
 */

import { z } from 'zod';
import { CUSTOMIZATION_LIMITS, VALIDATION_PATTERNS } from '@/lib/constants/customization';

// ========================================
// ENUMS
// ========================================

export const ZoneTypeEnum = z.enum(['TEXT', 'IMAGE', 'PATTERN', 'COLOR']);
export const CustomizationEffectEnum = z.enum(['NORMAL', 'EMBOSSED', 'ENGRAVED', 'THREE_D']);
export const CustomizationOrientationEnum = z.enum(['horizontal', 'vertical', 'curved']);
export const CustomizationStatusEnum = z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'FAILED']);

// ========================================
// VALIDATORS BASE
// ========================================

/**
 * Valide un prompt utilisateur
 */
export const promptValidator = z
  .string()
  .min(CUSTOMIZATION_LIMITS.PROMPT_MIN_LENGTH, {
    message: `Le texte doit contenir au moins ${CUSTOMIZATION_LIMITS.PROMPT_MIN_LENGTH} caractère(s)`,
  })
  .max(CUSTOMIZATION_LIMITS.PROMPT_MAX_LENGTH, {
    message: `Le texte ne peut pas dépasser ${CUSTOMIZATION_LIMITS.PROMPT_MAX_LENGTH} caractères`,
  })
  .refine(
    (val) => val.trim().length > 0,
    {
      message: 'Le texte ne peut pas être vide',
    }
  )
  .refine(
    (val) => !VALIDATION_PATTERNS.FORBIDDEN_CHARS.test(val),
    {
      message: 'Le texte contient des caractères interdits',
    }
  );

/**
 * Valide une couleur hex
 */
export const colorValidator = z
  .string()
  .regex(VALIDATION_PATTERNS.COLOR_HEX, {
    message: 'La couleur doit être au format hexadécimal (#RRGGBB)',
  })
  .optional();

/**
 * Valide une taille de police
 */
export const fontSizeValidator = z
  .number()
  .int()
  .min(CUSTOMIZATION_LIMITS.FONT_SIZE_MIN, {
    message: `La taille de police doit être d'au moins ${CUSTOMIZATION_LIMITS.FONT_SIZE_MIN}px`,
  })
  .max(CUSTOMIZATION_LIMITS.FONT_SIZE_MAX, {
    message: `La taille de police ne peut pas dépasser ${CUSTOMIZATION_LIMITS.FONT_SIZE_MAX}px`,
  })
  .optional();

/**
 * Valide un nom de police
 */
export const fontNameValidator = z
  .string()
  .regex(VALIDATION_PATTERNS.FONT_NAME, {
    message: 'Le nom de la police contient des caractères invalides',
  })
  .optional();

// ========================================
// VALIDATORS ZONES
// ========================================

/**
 * Valide une position 3D
 */
export const position3DValidator = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

/**
 * Valide une rotation 3D
 */
export const rotation3DValidator = z.object({
  x: z.number().finite().default(0),
  y: z.number().finite().default(0),
  z: z.number().finite().default(0),
});

/**
 * Valide un scale 3D
 */
export const scale3DValidator = z.object({
  x: z.number().positive().default(1),
  y: z.number().positive().default(1),
  z: z.number().positive().default(1),
});

/**
 * Valide un UV mapping
 */
export const uvMappingValidator = z.object({
  u: z.array(z.number().min(0).max(1)).length(2),
  v: z.array(z.number().min(0).max(1)).length(2),
}).refine(
  (val) => val.u[0] < val.u[1],
  {
    message: 'uMin doit être inférieur à uMax',
    path: ['u'],
  }
).refine(
  (val) => val.v[0] < val.v[1],
  {
    message: 'vMin doit être inférieur à vMax',
    path: ['v'],
  }
);

/**
 * Valide une zone complète
 */
export const zoneValidator = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, { message: 'Le nom de la zone est requis' }).max(100),
  description: z.string().max(500).optional(),
  type: ZoneTypeEnum,
  positionX: z.number().finite(),
  positionY: z.number().finite(),
  positionZ: z.number().finite(),
  rotationX: z.number().finite().default(0),
  rotationY: z.number().finite().default(0),
  rotationZ: z.number().finite().default(0),
  scaleX: z.number().positive().default(1),
  scaleY: z.number().positive().default(1),
  scaleZ: z.number().positive().default(1),
  uvMinU: z.number().min(0).max(1),
  uvMaxU: z.number().min(0).max(1),
  uvMinV: z.number().min(0).max(1),
  uvMaxV: z.number().min(0).max(1),
  maxChars: z.number().int().positive().optional(),
  allowedFonts: z.array(z.string()).optional(),
  defaultFont: fontNameValidator,
  defaultColor: colorValidator,
  defaultSize: fontSizeValidator,
  allowedColors: z.array(colorValidator).optional(),
  allowedPatterns: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
  metadata: z.record(z.any()).optional(),
}).refine(
  (val) => val.uvMinU < val.uvMaxU,
  {
    message: 'uvMinU doit être inférieur à uvMaxU',
    path: ['uvMinU'],
  }
).refine(
  (val) => val.uvMinV < val.uvMaxV,
  {
    message: 'uvMinV doit être inférieur à uvMaxV',
    path: ['uvMinV'],
  }
);

// ========================================
// VALIDATORS PERSONNALISATION
// ========================================

/**
 * Valide les options de personnalisation
 */
export const customizationOptionsValidator = z.object({
  font: fontNameValidator,
  color: colorValidator,
  size: fontSizeValidator,
  effect: CustomizationEffectEnum.optional(),
  orientation: CustomizationOrientationEnum.optional(),
  options: z.record(z.any()).optional(),
});

/**
 * Valide une requête de génération
 */
export const generateCustomizationValidator = z.object({
  productId: z.string().cuid({ message: 'productId invalide' }),
  zoneId: z.string().cuid({ message: 'zoneId invalide' }),
  prompt: promptValidator,
  font: fontNameValidator,
  color: colorValidator,
  size: fontSizeValidator,
  effect: CustomizationEffectEnum.default('ENGRAVED'),
  orientation: CustomizationOrientationEnum.optional(),
  options: z.record(z.any()).optional(),
});

/**
 * Valide une personnalisation complète
 */
export const customizationValidator = z.object({
  id: z.string().cuid(),
  name: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  prompt: promptValidator,
  promptHash: z.string().optional(),
  zoneId: z.string().cuid(),
  productId: z.string().cuid(),
  font: fontNameValidator,
  color: colorValidator,
  size: fontSizeValidator,
  effect: CustomizationEffectEnum,
  orientation: CustomizationOrientationEnum.optional(),
  options: z.record(z.any()).optional(),
  status: CustomizationStatusEnum,
  jobId: z.string().optional(),
  textureUrl: z.string().url().optional(),
  modelUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  highResUrl: z.string().url().optional(),
  arModelUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  errorMessage: z.string().optional(),
  retryCount: z.number().int().min(0).default(0),
  costCents: z.number().int().min(0),
  processingTimeMs: z.number().int().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  userId: z.string().cuid().optional(),
  brandId: z.string().cuid().optional(),
  designId: z.string().cuid().optional(),
  orderId: z.string().cuid().optional(),
});

// ========================================
// VALIDATORS BATCH
// ========================================

/**
 * Valide plusieurs zones
 */
export const zonesValidator = z.array(zoneValidator).min(1, {
  message: 'Au moins une zone est requise',
}).max(50, {
  message: 'Maximum 50 zones par produit',
});

/**
 * Valide plusieurs personnalisations
 */
export const customizationsValidator = z.array(customizationValidator);

// ========================================
// HELPERS
// ========================================

/**
 * Valide un prompt avec messages d'erreur personnalisés
 */
export function validatePrompt(prompt: string): {
  isValid: boolean;
  errors: string[];
} {
  try {
    promptValidator.parse(prompt);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => e.message),
      };
    }
    return { isValid: false, errors: ['Erreur de validation inconnue'] };
  }
}

/**
 * Valide une zone avec messages d'erreur personnalisés
 */
export function validateZone(zone: unknown): {
  isValid: boolean;
  errors: string[];
  data?: z.infer<typeof zoneValidator>;
} {
  try {
    const data = zoneValidator.parse(zone);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { isValid: false, errors: ['Erreur de validation inconnue'] };
  }
}

/**
 * Valide une requête de génération
 */
export function validateGenerateRequest(request: unknown): {
  isValid: boolean;
  errors: string[];
  data?: z.infer<typeof generateCustomizationValidator>;
} {
  try {
    const data = generateCustomizationValidator.parse(request);
    return { isValid: true, errors: [], data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { isValid: false, errors: ['Erreur de validation inconnue'] };
  }
}

// ========================================
// EXPORT
// ========================================

export {
  ZoneTypeEnum,
  CustomizationEffectEnum,
  CustomizationOrientationEnum,
  CustomizationStatusEnum,
  promptValidator,
  colorValidator,
  fontSizeValidator,
  fontNameValidator,
  position3DValidator,
  rotation3DValidator,
  scale3DValidator,
  uvMappingValidator,
  zoneValidator,
  customizationOptionsValidator,
  generateCustomizationValidator,
  customizationValidator,
  zonesValidator,
  customizationsValidator,
};

