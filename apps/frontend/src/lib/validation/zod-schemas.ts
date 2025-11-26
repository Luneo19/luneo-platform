/**
 * Schémas de validation Zod professionnels
 * Standardise la validation des entrées API avec messages d'erreur clairs
 */

import { z } from 'zod';

// Réexporter z pour permettre l'import depuis ce fichier
export { z };

/**
 * Schéma de base pour les IDs
 */
export const idSchema = z.string().uuid('ID invalide');

/**
 * Schéma pour les emails
 */
export const emailSchema = z
  .string()
  .email('Format d\'email invalide')
  .min(1, 'L\'email est requis')
  .max(255, 'L\'email ne peut pas dépasser 255 caractères');

/**
 * Schéma pour les mots de passe
 */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères');

/**
 * Schéma pour les URLs
 */
export const urlSchema = z
  .string()
  .url('Format d\'URL invalide')
  .max(2048, 'L\'URL ne peut pas dépasser 2048 caractères');

/**
 * Schéma pour les noms (collections, produits, etc.)
 */
export const nameSchema = z
  .string()
  .min(1, 'Le nom est requis')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères')
  .trim();

/**
 * Schéma pour les descriptions
 */
export const descriptionSchema = z
  .string()
  .max(500, 'La description ne peut pas dépasser 500 caractères')
  .trim()
  .optional();

/**
 * Schéma pour les tags
 */
export const tagsSchema = z
  .array(z.string().min(1).max(50))
  .max(10, 'Maximum 10 tags autorisés')
  .optional();

/**
 * Schéma pour les couleurs (hex)
 */
export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide (doit être #RRGGBB)')
  .optional();

/**
 * Schéma pour les paginations
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schéma pour les tris
 */
export const sortSchema = z.object({
  field: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schéma pour créer une collection
 */
export const createCollectionSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  color: colorSchema,
  is_public: z.boolean().default(false),
  tags: tagsSchema,
});

/**
 * Schéma pour mettre à jour une collection (tous les champs optionnels)
 */
export const updateCollectionSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
  color: colorSchema,
  is_public: z.boolean().optional(),
  tags: tagsSchema,
  sort_order: z.number().int().min(0).optional(),
});

/**
 * Schéma pour ajouter des designs à une collection
 */
export const addDesignsToCollectionSchema = z.object({
  design_ids: z.array(idSchema).min(1, 'Au moins un design doit être sélectionné'),
});

/**
 * Schéma pour créer un design
 */
export const createDesignSchema = z.object({
  prompt: z.string().min(1, 'Le prompt est requis').max(1000, 'Le prompt ne peut pas dépasser 1000 caractères'),
  preview_url: urlSchema,
  original_url: urlSchema.optional(),
  style: z.string().optional(),
  width: z.number().int().min(1).max(4096).optional(),
  height: z.number().int().min(1).max(4096).optional(),
  format: z.enum(['png', 'jpg', 'webp']).default('png'),
  tags: tagsSchema,
  metadata: z.record(z.any()).optional(),
});

/**
 * Schéma pour mettre à jour un design
 */
export const updateDesignSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
  tags: tagsSchema,
  is_public: z.boolean().optional(),
});

/**
 * Schéma pour l'adresse de livraison/facturation
 */
export const addressSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  street: z.string().min(1, 'La rue est requise'),
  city: z.string().min(1, 'La ville est requise'),
  postal_code: z.string().min(1, 'Le code postal est requis'),
  country: z.string().length(2, 'Le code pays doit être sur 2 caractères'),
  phone: z.string().optional(),
});

/**
 * Schéma pour un item de commande
 */
export const orderItemSchema = z.object({
  product_id: idSchema,
  design_id: idSchema.optional(),
  design_name: z.string().optional(),
  design_preview_url: urlSchema.optional(),
  design_print_url: urlSchema.optional(),
  quantity: z.number().int().min(1, 'La quantité doit être au moins 1').max(1000, 'La quantité ne peut pas dépasser 1000'),
  customization: z.record(z.any()).optional(),
  production_notes: z.string().max(500).optional(),
});

/**
 * Schéma pour créer une commande
 */
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Au moins un produit est requis'),
  shipping_address: addressSchema,
  billing_address: addressSchema.optional(),
  payment_method: z.enum(['card', 'paypal', 'bank_transfer']).default('card'),
  shipping_method: z.enum(['standard', 'express', 'overnight']).default('standard'),
  customer_notes: z.string().max(1000).optional(),
  discount_code: z.string().max(50).optional(),
});

// Note: createWebhookSchema est défini plus bas avec une structure complète
// Note: connectIntegrationSchema est défini plus bas avec une structure différente

/**
 * Schéma pour une variante de produit
 */
export const productVariantSchema = z.object({
  name: z.string().min(1, 'Le nom de la variante est requis').max(100),
  sku: z.string().max(100).optional(),
  price: z.number().min(0, 'Le prix doit être positif').optional(),
  stock: z.number().int().min(0).nullable().optional(),
  attributes: z.record(z.any()).optional(),
});

/**
 * Schéma pour créer un produit
 */
export const createProductSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  sku: z.string().max(100).optional(),
  base_price: z.number().min(0, 'Le prix doit être positif'),
  currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
  images: z.array(urlSchema).max(10, 'Maximum 10 images').optional(),
  variants: z.array(productVariantSchema).max(50, 'Maximum 50 variantes').optional(),
  customization_options: z.record(z.any()).optional(),
});

/**
 * Schéma pour mettre à jour un produit
 */
export const updateProductSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
  sku: z.string().max(100).optional(),
  base_price: z.number().min(0, 'Le prix doit être positif').optional(),
  currency: z.enum(['EUR', 'USD', 'GBP']).optional(),
  images: z.array(urlSchema).max(10, 'Maximum 10 images').optional(),
  variants: z.array(productVariantSchema).max(50, 'Maximum 50 variantes').optional(),
  customization_options: z.record(z.any()).optional(),
  stock: z.number().int().min(0).nullable().optional(),
});


/**
 * Schéma pour créer une notification
 */
export const createNotificationSchema = z.object({
  type: z.enum(['success', 'info', 'warning', 'error', 'order', 'payment', 'design', 'system']),
  title: z.string().min(1, 'Le titre est requis').max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  message: z.string().min(1, 'Le message est requis').max(1000, 'Le message ne peut pas dépasser 1000 caractères'),
  resource_type: z.string().max(50).optional(),
  resource_id: idSchema.optional(),
  action_url: urlSchema.optional(),
  action_label: z.string().max(50).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schéma pour mettre à jour une notification
 */
export const updateNotificationSchema = z.object({
  is_read: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  mark_all_read: z.boolean().optional(),
});

/**
 * Schéma pour connecter une intégration
 */
export const connectIntegrationSchema = z.object({
  service: z.enum(['shopify', 'woocommerce', 'stripe', 'sendgrid', 'cloudinary'], {
    errorMap: () => ({ message: 'Service invalide. Services supportés: shopify, woocommerce, stripe, sendgrid, cloudinary' }),
  }),
  credentials: z.record(z.string(), z.any()).refine(
    (obj) => Object.keys(obj).length >= 1,
    { message: 'Les credentials sont requis' }
  ),
  config: z.record(z.any()).optional(),
});

/**
 * Schéma pour mettre à jour un abonnement
 */
export const updateSubscriptionSchema = z.object({
  action: z.enum(['cancel', 'resume', 'change_plan', 'update_payment_method'], {
    errorMap: () => ({ message: 'Action invalide. Actions supportées: cancel, resume, change_plan, update_payment_method' }),
  }),
  planId: z.string().uuid('ID de plan invalide').optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

/**
 * Schéma pour créer une session de checkout
 */
export const createCheckoutSessionSchema = z.object({
  planId: z.string().uuid('ID de plan invalide'),
  successUrl: urlSchema,
  cancelUrl: urlSchema,
  customerEmail: emailSchema.optional(),
});

/**
 * Schéma pour ajouter un favori
 */
export const addFavoriteSchema = z.object({
  resource_id: idSchema,
  resource_type: z.enum(['design', 'template', 'clipart', 'product'], {
    errorMap: () => ({ message: 'Type de ressource invalide. Types supportés: design, template, clipart, product' }),
  }),
});

/**
 * Schéma pour changer le mot de passe
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: passwordSchema,
});

/**
 * Schéma pour les paramètres de recherche
 */
export const searchSchema = z.object({
  q: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ...paginationSchema.shape,
  ...sortSchema.shape,
});

// ============================================================================
// SCHÉMAS AR/3D
// ============================================================================

/**
 * Schéma pour exporter un modèle AR
 */
export const exportARModelSchema = z.object({
  ar_model_id: idSchema,
  format: z.enum(['glb', 'gltf', 'usdz'], {
    errorMap: () => ({ message: 'Format invalide. Utilisez glb, gltf ou usdz' }),
  }),
});

/**
 * Schéma pour convertir une image 2D en modèle 3D
 */
export const convert2DTo3DSchema = z.object({
  design_id: idSchema,
  image_url: urlSchema,
});

/**
 * Schéma pour exporter une configuration AR
 */
export const exportARConfigurationSchema = z.object({
  configurationId: idSchema,
  platform: z.enum(['ios', 'android', 'web'], {
    errorMap: () => ({ message: 'Plateforme non supportée. Options: ios, android, web' }),
  }),
  includeTextures: z.boolean().default(true),
  maxTextureSize: z.number().int().min(256).max(4096).default(2048),
  compression: z.boolean().default(true),
});

/**
 * Schéma pour rendre une configuration 3D haute résolution
 */
export const renderHighresSchema = z.object({
  configurationId: idSchema,
  preset: z.enum(['thumbnail', 'preview', 'hd', '2k', '4k', 'print']).default('hd'),
  width: z.number().int().min(256).max(8192).optional(),
  height: z.number().int().min(256).max(8192).optional(),
  format: z.enum(['png', 'jpg', 'webp']).default('png'),
  quality: z.number().min(0.1).max(1.0).default(1.0),
  transparent: z.boolean().default(false),
  watermark: z.string().max(100).optional(),
});

// ============================================================================
// SCHÉMAS DESIGNS
// ============================================================================

/**
 * Schéma pour sauvegarder un design personnalisé
 */
export const saveCustomDesignSchema = z.object({
  name: z.string().min(1, 'Le nom du design est requis').max(200, 'Le nom du design ne peut pas dépasser 200 caractères').trim(),
  design_data: z.record(z.any(), z.any()).or(z.string()), // Peut être un objet ou une string JSON
  product_id: idSchema.optional().nullable(),
  thumbnail_url: urlSchema.optional().nullable(),
  tags: tagsSchema,
});

/**
 * Schéma pour mettre à jour un design personnalisé
 */
export const updateCustomDesignSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  design_data: z.record(z.any(), z.any()).or(z.string()).optional(),
  product_id: idSchema.optional().nullable(),
  thumbnail_url: urlSchema.optional().nullable(),
  tags: tagsSchema,
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

/**
 * Schéma pour exporter un design pour l'impression
 */
export const exportPrintSchema = z.object({
  designId: idSchema,
  format: z.enum(['pdf', 'png', 'jpg', 'svg']).default('pdf'),
  quality: z.enum(['low', 'medium', 'high', 'ultra']).default('high'),
  dimensions: z.object({
    width: z.number().int().min(1).max(10000).optional(),
    height: z.number().int().min(1).max(10000).optional(),
  }).optional(),
});

/**
 * Schéma pour créer un lien de partage de design
 */
export const shareDesignSchema = z.object({
  expires_in_days: z.number().int().min(1).max(365).default(30),
  password: z.string().min(4, 'Le mot de passe doit contenir au moins 4 caractères').max(128).optional(),
});

// ============================================================================
// SCHÉMAS INTEGRATIONS
// ============================================================================

/**
 * Schéma pour connecter un store WooCommerce
 */
export const connectWooCommerceSchema = z.object({
  store_url: urlSchema,
  consumer_key: z.string().min(1, 'La clé consommateur est requise').max(256),
  consumer_secret: z.string().min(1, 'Le secret consommateur est requis').max(256),
});

/**
 * Schéma pour synchroniser WooCommerce
 */
export const syncWooCommerceSchema = z.object({
  integration_id: idSchema,
  sync_type: z.enum(['products', 'orders', 'customers', 'all']).default('products'),
  force: z.boolean().default(false),
});

// ============================================================================
// SCHÉMAS EMAILS
// ============================================================================

/**
 * Schéma pour envoyer un email générique
 */
export const sendEmailSchema = z.object({
  to: emailSchema,
  subject: z.string().min(1, 'Le sujet est requis').max(200, 'Le sujet ne peut pas dépasser 200 caractères'),
  template: z.string().max(100).optional(),
  data: z.record(z.any()).optional(),
  html: z.string().max(100000).optional(), // Limite de taille HTML
  text: z.string().max(100000).optional(), // Limite de taille texte
});

/**
 * Schéma pour envoyer un email de confirmation de commande
 */
export const sendOrderConfirmationEmailSchema = z.object({
  orderId: idSchema,
});

/**
 * Schéma pour envoyer un email de production prête
 */
export const sendProductionReadyEmailSchema = z.object({
  orderId: idSchema,
  productionFiles: z.array(z.object({
    url: urlSchema,
    name: z.string().max(255),
    size: z.number().int().min(0).optional(),
    type: z.string().max(100).optional(),
  })).min(1, 'Au moins un fichier de production est requis'),
});

/**
 * Schéma pour envoyer un email de bienvenue
 */
export const sendWelcomeEmailSchema = z.object({
  email: emailSchema,
  name: z.string().min(1).max(200).optional(),
  redirectUrl: urlSchema.optional(),
});

// ============================================================================
// SCHÉMAS WEBHOOKS
// ============================================================================

/**
 * Schéma pour créer un webhook
 */
export const createWebhookSchema = z.object({
  name: nameSchema,
  url: urlSchema,
  events: z.array(z.string().min(1, 'Un événement ne peut pas être vide')).min(1, 'Au moins un événement est requis').max(50, 'Maximum 50 événements'),
  secret: z.string().min(16, 'Le secret doit contenir au moins 16 caractères').max(256).optional(),
});

// ============================================================================
// SCHÉMAS AUTRES ROUTES
// ============================================================================

/**
 * Schéma pour supprimer un compte (RGPD)
 */
export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Vous devez écrire "DELETE" pour confirmer la suppression' }),
  }),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

/**
 * Schéma pour enregistrer un téléchargement
 */
export const createDownloadSchema = z.object({
  resource_id: idSchema,
  resource_type: z.enum(['design', 'template', 'clipart', 'product'], {
    errorMap: () => ({ message: 'Type de ressource invalide. Types supportés: design, template, clipart, product' }),
  }),
  file_url: urlSchema,
  file_size: z.number().int().min(0).optional(),
  format: z.string().max(50).optional(),
});

/**
 * Schéma pour ajouter un favori à la bibliothèque
 */
export const addLibraryFavoriteSchema = z.object({
  resource_id: idSchema,
  resource_type: z.enum(['template', 'clipart'], {
    errorMap: () => ({ message: 'Type de ressource invalide. Types supportés: template, clipart' }),
  }),
});

/**
 * Schéma pour générer une image avec AI
 */
export const generateAISchema = z.object({
  prompt: z.string().min(1, 'Le prompt est requis').max(1200, 'Le prompt ne peut pas dépasser 1200 caractères'),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1024x1024'),
  quality: z.enum(['standard', 'hd']).default('standard'),
  style: z.enum(['vivid', 'natural']).default('vivid'),
});

/**
 * Schéma pour gérer la 2FA
 */
export const manage2FASchema = z.object({
  action: z.enum(['enable', 'disable'], {
    errorMap: () => ({ message: 'Action invalide. Utilisez "enable" ou "disable"' }),
  }),
  token: z.string().length(6, 'Le token doit contenir 6 chiffres').optional(),
});

/**
 * Schéma pour changer le mot de passe (settings)
 */
export const changePasswordSettingsSchema = z.object({
  current_password: z.string().min(1, 'Le mot de passe actuel est requis'),
  new_password: passwordSchema,
  confirm_password: z.string().min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Les nouveaux mots de passe ne correspondent pas',
  path: ['confirm_password'],
});

/**
 * Schéma pour créer un template
 */
export const createTemplateSchema = z.object({
  name: nameSchema.max(200, 'Le nom du template ne peut pas dépasser 200 caractères'),
  category: z.string().max(100).optional(),
  thumbnail_url: urlSchema.optional(),
  template_data: z.any(), // JSON object or string
  tags: tagsSchema,
  is_premium: z.boolean().default(false),
});

/**
 * Schéma pour créer un clipart
 */
export const createClipartSchema = z.object({
  name: nameSchema.max(200, 'Le nom du clipart ne peut pas dépasser 200 caractères'),
  image_url: urlSchema,
  category: z.string().max(100).optional(),
  tags: tagsSchema,
  is_premium: z.boolean().default(false),
});

/**
 * Schéma pour créer une clé API
 */
export const createApiKeySchema = z.object({
  name: nameSchema.max(200, 'Le nom de la clé API ne peut pas dépasser 200 caractères'),
  permissions: z.array(z.string()).max(20, 'Maximum 20 permissions').optional(),
  expires_in_days: z.number().int().min(1).max(365).optional(),
});

/**
 * Schéma pour inviter un membre d'équipe
 */
export const inviteTeamMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'manager', 'designer', 'member', 'viewer']).default('member'),
  permissions: z.array(z.string()).max(20, 'Maximum 20 permissions').optional(),
});

/**
 * Schéma pour synchroniser Shopify
 */
export const syncShopifySchema = z.object({
  integrationId: idSchema,
  direction: z.enum(['import', 'export', 'bidirectional']).default('import'),
});

/**
 * Schéma pour l'onboarding
 */
export const onboardingSchema = z.object({
  step: z.enum(['welcome', 'profile', 'preferences', 'complete'], {
    errorMap: () => ({ message: 'Étape invalide. Étapes valides: welcome, profile, preferences, complete' }),
  }),
  data: z.record(z.any()), // JSON object
});

/**
 * Schéma pour générer des fichiers de production pour une commande
 */
export const generateProductionFilesSchema = z.object({
  orderId: idSchema,
  designId: idSchema,
  format: z.enum(['pdf', 'png', 'jpg', 'svg']).default('pdf').optional(),
  quality: z.enum(['low', 'medium', 'high', 'ultra']).default('high').optional(),
});

/**
 * Schéma pour convertir GLB vers USDZ
 */
export const convertUSDZSchema = z.object({
  glb_url: urlSchema,
  optimize: z.boolean().default(true).optional(),
});

/**
 * Schéma pour les webhooks de notifications
 */
export const webhookNotificationSchema = z.object({
  event: z.string().min(1, 'L\'événement est requis').max(100, 'L\'événement ne peut pas dépasser 100 caractères'),
  data: z.record(z.any()), // JSON object
  resource_type: z.string().max(50).optional(),
  resource_id: idSchema.optional(),
});

/**
 * Schéma pour gérer les features des tenants admin
 */
export const manageTenantFeaturesSchema = z.object({
  feature: z.string().min(1, 'La feature est requise').max(100, 'La feature ne peut pas dépasser 100 caractères'),
  enabled: z.boolean().optional(),
});

/**
 * Schéma pour gérer les méthodes de paiement
 */
export const managePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, 'L\'ID de la méthode de paiement est requis').max(255),
  action: z.enum(['set_default', 'remove']).optional(),
});

/**
 * Fonction helper pour valider avec Zod et retourner des erreurs formatées
 */
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Erreur de validation inconnue'] };
  }
}

/**
 * Fonction helper pour valider et lancer une erreur si invalide
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      throw new Error(errorMessage || `Validation failed: ${errors.join('; ')}`);
    }
    throw error;
  }
}

