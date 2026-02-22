/**
 * ★★★ ROUTER TRPC - PERSONNALISATION COMPLET ★★★
 * Gestion complète des personnalisations de produits
 * - Génération depuis prompt IA
 * - CRUD personnalisations
 * - Gestion cache
 * - Validation complète
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../server';
import { TRPCError } from '@trpc/server';
import { logger } from '@/lib/logger';
import { api, endpoints } from '@/lib/api/client';
import { getBackendUrl } from '@/lib/api/server-url';

// ========================================
// SCHEMAS ZOD
// ========================================

const ZoneTypeSchema = z.enum(['TEXT', 'IMAGE', 'PATTERN', 'COLOR']);
const CustomizationEffectSchema = z.enum(['NORMAL', 'EMBOSSED', 'ENGRAVED', 'THREE_D']);
const CustomizationStatusSchema = z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'FAILED']);

const CreateZoneSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: ZoneTypeSchema,
  positionX: z.number(),
  positionY: z.number(),
  positionZ: z.number(),
  rotationX: z.number().default(0),
  rotationY: z.number().default(0),
  rotationZ: z.number().default(0),
  scaleX: z.number().default(1),
  scaleY: z.number().default(1),
  scaleZ: z.number().default(1),
  uvMinU: z.number().min(0).max(1),
  uvMaxU: z.number().min(0).max(1),
  uvMinV: z.number().min(0).max(1),
  uvMaxV: z.number().min(0).max(1),
  maxChars: z.number().int().positive().optional(),
  allowedFonts: z.array(z.string()).optional(),
  defaultFont: z.string().optional(),
  defaultColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  defaultSize: z.number().int().positive().optional(),
  allowedColors: z.array(z.string()).optional(),
  allowedPatterns: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
  order: z.number().int().default(0),
  metadata: z.record(z.unknown()).optional(),
});

const UpdateZoneSchema = CreateZoneSchema.partial().extend({
  id: z.string().min(1),
  productId: z.string().min(1),
});

const GenerateCustomizationSchema = z.object({
  productId: z.string().min(1),
  zoneId: z.string().min(1),
  prompt: z.string().min(1).max(500),
  font: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  size: z.number().int().positive().optional(),
  effect: CustomizationEffectSchema.optional(),
  orientation: z.enum(['horizontal', 'vertical', 'curved']).optional(),
  options: z.record(z.unknown()).optional(),
});

const UpdateCustomizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  options: z.record(z.unknown()).optional(),
});

// ========================================
// ROUTER
// ========================================

export const customizationRouter = router({
  // ========================================
  // ZONES
  // ========================================

  /**
   * Créer une zone personnalisable
   */
  createZone: protectedProcedure
    .input(CreateZoneSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating zone', { productId: input.productId, name: input.name });

        const product = await endpoints.products.get(input.productId).catch(() => null);
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        const user = await endpoints.auth.me() as { role?: string; brandId?: string };
        const p = product as { brandId?: string };
        if (
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== p.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier ce produit',
          });
        }

        type ZoneApiResponse = { id: string };
        const zone = await api.post<ZoneApiResponse & Record<string, unknown>>(`/api/v1/product-engine/products/${input.productId}/zones`, { ...input });

        logger.info('Zone created', { zoneId: zone.id });

        return zone;
      } catch (error) {
        logger.error('Error creating zone', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création de la zone',
        });
      }
    }),

  /**
   * Mettre à jour une zone
   */
  updateZone: protectedProcedure
    .input(UpdateZoneSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, productId, ...data } = input;

        const product = await endpoints.products.get(productId).catch(() => null);
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        const user = await endpoints.auth.me() as { role?: string; brandId?: string };
        const p = product as { brandId?: string };
        if (
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== p.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier cette zone',
          });
        }

        const zone = await api.get<unknown>(`/api/v1/product-engine/products/${productId}/zones/${id}`).catch(() => null);
        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        const updated = await api.put<Record<string, unknown>>(`/api/v1/product-engine/products/${productId}/zones/${id}`, data);

        logger.info('Zone updated', { zoneId: id });

        return updated;
      } catch (error) {
        logger.error('Error updating zone', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour de la zone',
        });
      }
    }),

  /**
   * Supprimer une zone
   */
  deleteZone: protectedProcedure
    .input(z.object({ id: z.string().min(1), productId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const zone = await api.get<{ product?: { brandId?: string }; productId?: string }>(`/api/v1/product-engine/products/${input.productId}/zones/${input.id}`).catch(() => null);
        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        const user = await endpoints.auth.me() as { role?: string; brandId?: string };
        const z = zone as { product?: { brandId?: string }; productId?: string };
        const zoneBrandId = z.product?.brandId;
        if (
          user?.role !== 'PLATFORM_ADMIN' &&
          zoneBrandId != null &&
          user?.brandId !== zoneBrandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de supprimer cette zone',
          });
        }

        await api.delete(`/api/v1/product-engine/products/${input.productId}/zones/${input.id}`);

        logger.info('Zone deleted', { zoneId: input.id });

        return { success: true };
      } catch (error) {
        logger.error('Error deleting zone', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression de la zone',
        });
      }
    }),

  /**
   * Récupérer les zones d'un produit
   */
  getZonesByProduct: publicProcedure
    .input(z.object({ productId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const zones = await api.get<unknown[]>(`/api/v1/product-engine/products/${input.productId}/zones`, {
          params: { isActive: true },
        }).catch(() => []);
        return Array.isArray(zones) ? zones : [];
      } catch (error) {
        logger.error('Error fetching zones', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des zones',
        });
      }
    }),

  // ========================================
  // PERSONNALISATIONS
  // ========================================

  /**
   * ★ GÉNÉRATION DEPUIS PROMPT IA ★
   */
  generateFromPrompt: protectedProcedure
    .input(GenerateCustomizationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Generating customization from prompt', {
          productId: input.productId,
          zoneId: input.zoneId,
          promptLength: input.prompt.length,
        });

        const product = await endpoints.products.get(input.productId).catch(() => null);
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        const zones = await api.get<{ id: string }[]>(`/api/v1/product-engine/products/${input.productId}/zones`).catch(() => []);
        const zonesList = Array.isArray(zones) ? zones : (product as { zones?: { id: string }[] }).zones ?? [];
        const zone = zonesList.find((z) => z.id === input.zoneId);
        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        type ZoneLike = { id: string; type?: string; allowedFonts?: string[]; allowedColors?: string[]; maxChars?: number; defaultFont?: string; defaultColor?: string; defaultSize?: number };
        const z = zone as ZoneLike;
        // 2. Valide les options selon la zone
        if (z.type === 'TEXT') {
          if (input.font && z.allowedFonts && !z.allowedFonts.includes(input.font)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Police non autorisée. Polices autorisées: ${z.allowedFonts.join(', ')}`,
            });
          }

          if (input.color && z.allowedColors && !z.allowedColors.includes(input.color)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Couleur non autorisée. Couleurs autorisées: ${z.allowedColors.join(', ')}`,
            });
          }

          if (input.prompt.length > (z.maxChars || 500)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Texte trop long. Maximum ${z.maxChars || 500} caractères`,
            });
          }
        }

        // Use the NestJS generation pipeline (BullMQ queue + AI providers)
        const backendUrl = getBackendUrl();
        const ctxWithHeaders = ctx as { user: typeof ctx.user; headers?: { cookie?: string; authorization?: string } };
        const generationResponse = await fetch(`${backendUrl}/api/v1/generation/dashboard/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': ctxWithHeaders.headers?.cookie || '',
            'Authorization': ctxWithHeaders.headers?.authorization || '',
          },
          body: JSON.stringify({
            productId: input.productId,
            customizations: {
              [input.zoneId]: {
                text: input.prompt,
                font: input.font || z.defaultFont || 'Arial',
                color: input.color || z.defaultColor || '#000000',
                size: input.size || z.defaultSize || 24,
                effect: (input.effect || 'ENGRAVED').toLowerCase(),
              },
            },
            userPrompt: input.prompt,
          }),
        });

        if (!generationResponse.ok) {
          const errBody = await generationResponse.json().catch(() => ({}));
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errBody.message || 'Erreur lors de la génération IA',
          });
        }

        const generation = await generationResponse.json();

        logger.info('Generation started via NestJS pipeline', {
          publicId: generation.publicId,
          productId: input.productId,
        });

        // Return immediately with GENERATING status
        return {
          id: generation.publicId || generation.id,
          status: 'GENERATING',
          message: 'Génération IA en cours...',
        };
      } catch (error) {
        logger.error('Error generating customization', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la génération',
        });
      }
    }),

  /**
   * Récupérer une personnalisation
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const customization = await api.get<Record<string, unknown>>(`/api/v1/customization/${input.id}`).catch(() => null);

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        const user = await endpoints.auth.me() as { role?: string; brandId?: string };
        const c = customization as { userId?: string; brandId?: string };
        if (
          c.userId !== ctx.user.id &&
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== c.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas accès à cette personnalisation',
          });
        }

        return customization;
      } catch (error) {
        logger.error('Error fetching customization', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération',
        });
      }
    }),

  /**
   * Lister les personnalisations de l'utilisateur
   */
  listMine: protectedProcedure
    .input(
      z
        .object({
          productId: z.string().optional(),
          status: CustomizationStatusSchema.optional(),
          limit: z.number().int().positive().max(100).default(20),
          offset: z.number().int().nonnegative().default(0),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        const result = await api.get<{ customizations?: unknown[]; data?: unknown[]; total?: number; pagination?: { total: number } }>('/api/v1/customization', {
          params: {
            productId: input?.productId,
            status: input?.status,
            limit: input?.limit ?? 20,
            offset: input?.offset ?? 0,
          },
        });

        const res = result as { customizations?: unknown[]; data?: unknown[]; pagination?: { total?: number }; total?: number };
        const customizations = res.customizations ?? res.data ?? [];
        const total = res.pagination?.total ?? res.total ?? (Array.isArray(customizations) ? customizations.length : 0);

        return {
          customizations: Array.isArray(customizations) ? customizations : [],
          total,
          hasMore: (input?.offset || 0) + (input?.limit || 20) < total,
        };
      } catch (error) {
        logger.error('Error listing customizations', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération',
        });
      }
    }),

  /**
   * Mettre à jour une personnalisation
   */
  update: protectedProcedure
    .input(UpdateCustomizationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...data } = input;

        const customization = await api.get<Record<string, unknown>>(`/api/v1/customization/${id}`).catch(() => null);

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        if ((customization as { userId?: string }).userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier cette personnalisation',
          });
        }

        const updated = await api.patch<Record<string, unknown>>(`/api/v1/customization/${id}`, data);

        logger.info('Customization updated', { customizationId: id });

        return updated;
      } catch (error) {
        logger.error('Error updating customization', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour',
        });
      }
    }),

  /**
   * Supprimer une personnalisation
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const customization = await api.get<Record<string, unknown>>(`/api/v1/customization/${input.id}`).catch(() => null);

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        const c = customization as { userId?: string; textureUrl?: string; modelUrl?: string; previewUrl?: string; highResUrl?: string; arModelUrl?: string };
        if (c.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de supprimer cette personnalisation',
          });
        }

        const filesToDelete: string[] = [];
        if (c.textureUrl) filesToDelete.push(c.textureUrl);
        if (c.modelUrl) filesToDelete.push(c.modelUrl);
        if (c.previewUrl) filesToDelete.push(c.previewUrl);
        if (c.highResUrl) filesToDelete.push(c.highResUrl);
        if (c.arModelUrl) filesToDelete.push(c.arModelUrl);

        if (filesToDelete.length > 0) {
          const { deleteFilesFromStorage } = await import('@/lib/storage/storage-service');
          deleteFilesFromStorage(filesToDelete).catch((error) => {
            logger.error('Error deleting customization files from storage', { error, customizationId: input.id });
          });
        }

        await api.delete(`/api/v1/customization/${input.id}`);

        logger.info('Customization deleted', { customizationId: input.id });

        return { success: true };
      } catch (error) {
        logger.error('Error deleting customization', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression',
        });
      }
    }),

  /**
   * Vérifier le statut d'une génération
   */
  checkStatus: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        // Try the NestJS generation status endpoint first (publicId-based)
        const backendUrl = getBackendUrl();
        const ctxWithHeaders = ctx as { user: typeof ctx.user; headers?: { cookie?: string; authorization?: string } };
        const genResponse = await fetch(`${backendUrl}/api/v1/generation/${input.id}/status`, {
          headers: {
            'Cookie': ctxWithHeaders.headers?.cookie || '',
            'Authorization': ctxWithHeaders.headers?.authorization || '',
          },
        }).catch(() => null);

        if (genResponse && genResponse.ok) {
          const genData = await genResponse.json();
          const status = genData.status?.toUpperCase() || 'PENDING';

          return {
            id: input.id,
            status,
            previewUrl: genData.result?.imageUrl || genData.result?.thumbnailUrl || null,
            modelUrl: genData.result?.arModelUrl || null,
            errorMessage: genData.error || null,
            completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
            userId: ctx.user.id,
          };
        }

        // Fallback: check /api/v1/customization/:id
        const customization = await api.get<Record<string, unknown>>(`/api/v1/customization/${input.id}`).catch(() => null);

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        const c = customization as { userId?: string; id: string; status: string; previewUrl?: string; modelUrl?: string; errorMessage?: string; completedAt?: unknown };

        return {
          id: c.id,
          status: c.status,
          previewUrl: c.previewUrl,
          modelUrl: c.modelUrl,
          errorMessage: c.errorMessage,
          completedAt: c.completedAt,
          userId: c.userId,
        };
      } catch (error) {
        logger.error('Error checking status', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la vérification',
        });
      }
    }),
});

