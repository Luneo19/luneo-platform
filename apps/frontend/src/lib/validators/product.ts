/**
 * ★★★ VALIDATORS - PRODUIT ★★★
 * Validators Zod complets pour les produits
 * - Validation produits
 * - Validation upload modèles
 * - Validation analytics
 */

import { z } from 'zod';

// ========================================
// ENUMS
// ========================================

export const ProductCategoryEnum = z.enum([
  'JEWELRY',
  'WATCHES',
  'GLASSES',
  'ACCESSORIES',
  'HOME',
  'TECH',
  'OTHER',
]);

export const ProductStatusEnum = z.enum([
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
]);

// ========================================
// VALIDATORS BASE
// ========================================

/**
 * Valide un nom de produit
 */
export const productNameValidator = z
  .string()
  .min(1, { message: 'Le nom du produit est requis' })
  .max(200, { message: 'Le nom ne peut pas dépasser 200 caractères' })
  .trim();

/**
 * Valide une description de produit
 */
export const productDescriptionValidator = z
  .string()
  .max(2000, { message: 'La description ne peut pas dépasser 2000 caractères' })
  .optional();

/**
 * Valide une URL de modèle 3D
 */
export const model3DUrlValidator = z
  .string()
  .url({ message: 'URL invalide' })
  .refine(
    (url) => {
      const ext = url.toLowerCase().split('.').pop();
      return ['glb', 'gltf', 'usdz', 'fbx', 'obj'].includes(ext || '');
    },
    {
      message: 'Format de modèle non supporté. Formats autorisés: .glb, .gltf, .usdz, .fbx, .obj',
    }
  )
  .optional();

/**
 * Valide une URL d'image
 */
export const imageUrlValidator = z
  .string()
  .url({ message: 'URL d\'image invalide' })
  .optional();

/**
 * Valide un prix
 */
export const priceValidator = z
  .number()
  .nonnegative({ message: 'Le prix doit être positif' })
  .finite()
  .optional();

/**
 * Valide une devise
 */
export const currencyValidator = z
  .enum(['EUR', 'USD', 'GBP', 'CAD', 'AUD'], {
    errorMap: () => ({ message: 'Devise non supportée' }),
  })
  .default('EUR');

// ========================================
// VALIDATORS PRODUIT
// ========================================

/**
 * Valide les dimensions d'un produit
 */
export const productDimensionsValidator = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  unit: z.enum(['mm', 'cm', 'm']).default('mm'),
}).optional();

/**
 * Valide les métadonnées d'un produit
 */
export const productMetadataValidator = z.object({
  modelUpload: z.object({
    fileName: z.string(),
    fileSize: z.number().positive(),
    fileType: z.string(),
    uploadedAt: z.string().datetime(),
  }).optional(),
  dimensions: productDimensionsValidator,
  materials: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
}).optional();

/**
 * Valide un produit complet
 */
export const productValidator = z.object({
  id: z.string().cuid(),
  name: productNameValidator,
  description: productDescriptionValidator,
  category: ProductCategoryEnum,
  model3dUrl: model3DUrlValidator,
  baseAssetUrl: imageUrlValidator,
  images: z.array(imageUrlValidator).optional(),
  price: priceValidator,
  currency: currencyValidator,
  isActive: z.boolean().default(true),
  status: ProductStatusEnum.default('DRAFT'),
  metadata: productMetadataValidator,
  createdAt: z.date(),
  updatedAt: z.date(),
  brandId: z.string().cuid(),
  createdBy: z.string().cuid(),
});

/**
 * Valide une requête de création de produit
 */
export const createProductValidator = z.object({
  name: productNameValidator,
  description: productDescriptionValidator,
  category: ProductCategoryEnum,
  model3dUrl: model3DUrlValidator,
  baseAssetUrl: imageUrlValidator,
  images: z.array(imageUrlValidator).optional(),
  price: priceValidator,
  currency: currencyValidator,
  isActive: z.boolean().default(true),
  metadata: productMetadataValidator,
});

/**
 * Valide une requête de mise à jour de produit
 */
export const updateProductValidator = createProductValidator.partial().extend({
  id: z.string().cuid(),
});

// ========================================
// VALIDATORS UPLOAD
// ========================================

/**
 * Valide un upload de modèle 3D
 */
export const uploadModelValidator = z.object({
  productId: z.string().cuid(),
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileSize: z.number().positive().max(100 * 1024 * 1024, {
    message: 'Le fichier ne peut pas dépasser 100MB',
  }),
  fileType: z.string().refine(
    (type) => ['model/gltf-binary', 'model/gltf+json', 'model/usd', 'model/fbx', 'model/obj'].includes(type) ||
               ['glb', 'gltf', 'usdz', 'fbx', 'obj'].includes(type.toLowerCase()),
    {
      message: 'Type de fichier non supporté',
    }
  ),
});

// ========================================
// VALIDATORS ANALYTICS
// ========================================

/**
 * Valide une requête d'analytics
 */
export const productAnalyticsValidator = z.object({
  productId: z.string().cuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(
  (val) => {
    if (val.startDate && val.endDate) {
      return val.startDate <= val.endDate;
    }
    return true;
  },
  {
    message: 'startDate doit être antérieure à endDate',
    path: ['startDate'],
  }
);

// ========================================
// VALIDATORS LIST
// ========================================

/**
 * Valide une requête de liste de produits
 */
export const productListValidator = z.object({
  brandId: z.string().cuid().optional(),
  category: ProductCategoryEnum.optional(),
  isActive: z.boolean().optional(),
  search: z.string().max(200).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

// ========================================
// HELPERS
// ========================================

/**
 * Valide un produit avec messages d'erreur personnalisés
 */
export function validateProduct(product: unknown): {
  isValid: boolean;
  errors: string[];
  data?: z.infer<typeof productValidator>;
} {
  try {
    const data = productValidator.parse(product);
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
 * Valide une requête de création
 */
export function validateCreateProduct(request: unknown): {
  isValid: boolean;
  errors: string[];
  data?: z.infer<typeof createProductValidator>;
} {
  try {
    const data = createProductValidator.parse(request);
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
 * Valide un upload de modèle
 */
export function validateUploadModel(request: unknown): {
  isValid: boolean;
  errors: string[];
  data?: z.infer<typeof uploadModelValidator>;
} {
  try {
    const data = uploadModelValidator.parse(request);
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
  ProductCategoryEnum,
  ProductStatusEnum,
  productNameValidator,
  productDescriptionValidator,
  model3DUrlValidator,
  imageUrlValidator,
  priceValidator,
  currencyValidator,
  productDimensionsValidator,
  productMetadataValidator,
  productValidator,
  createProductValidator,
  updateProductValidator,
  uploadModelValidator,
  productAnalyticsValidator,
  productListValidator,
};

