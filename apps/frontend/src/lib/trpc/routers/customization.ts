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
  metadata: z.record(z.any()).optional(),
});

const UpdateZoneSchema = CreateZoneSchema.partial().extend({
  id: z.string().min(1),
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
  options: z.record(z.any()).optional(),
});

const UpdateCustomizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  options: z.record(z.any()).optional(),
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
        const p = product as any;
        if (
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== p.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier ce produit',
          });
        }

        const zone = await api.post<any>(`/api/v1/products/${input.productId}/zones`, { ...input });

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
        const { id, ...data } = input;

        const zone = await api.get<any>(`/api/v1/zones/${id}`).catch(() => null);
        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        const user = await endpoints.auth.me() as { role?: string; brandId?: string };
        const z = zone as any;
        if (
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== z.product?.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier cette zone',
          });
        }

        const updated = await api.put<any>(`/api/v1/zones/${id}`, data);

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
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const zone = await api.get<any>(`/api/v1/zones/${input.id}`).catch(() => null);
        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        const user = await endpoints.auth.me() as { role?: string; brandId?: string };
        const z = zone as any;
        if (
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== z.product?.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de supprimer cette zone',
          });
        }

        await api.delete(`/api/v1/zones/${input.id}`);

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
        const zones = await api.get<any[]>(`/api/v1/products/${input.productId}/zones`, {
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

        const zones = await api.get<any[]>(`/api/v1/products/${input.productId}/zones`).catch(() => []);
        const zonesList = Array.isArray(zones) ? zones : (product as any).zones ?? [];
        const zone = zonesList.find((z: any) => z.id === input.zoneId);
        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        // 2. Valide les options selon la zone
        if (zone.type === 'TEXT') {
          if (input.font && zone.allowedFonts && !zone.allowedFonts.includes(input.font)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Police non autorisée. Polices autorisées: ${zone.allowedFonts.join(', ')}`,
            });
          }

          if (input.color && zone.allowedColors && !zone.allowedColors.includes(input.color)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Couleur non autorisée. Couleurs autorisées: ${zone.allowedColors.join(', ')}`,
            });
          }

          if (input.prompt.length > (zone.maxChars || 500)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Texte trop long. Maximum ${zone.maxChars || 500} caractères`,
            });
          }
        }

        const prod = product as any;
        const customization = await api.post<any>('/api/v1/customizations', {
          prompt: input.prompt,
          zoneId: input.zoneId,
          productId: input.productId,
          font: input.font || zone.defaultFont,
          color: input.color || zone.defaultColor || '#000000',
          size: input.size || zone.defaultSize || 24,
          effect: input.effect || 'ENGRAVED',
          orientation: input.orientation,
          options: input.options || {},
          status: 'GENERATING',
        });

        // 4. Appel au moteur IA Python (async, ne bloque pas)
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
        
        // Appel async (fire and forget pour l'instant)
        fetch(`${aiEngineUrl}/api/generate/texture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: input.prompt,
            font: input.font || zone.defaultFont || 'Arial',
            color: input.color || zone.defaultColor || '#000000',
            size: input.size || zone.defaultSize || 24,
            effect: (input.effect || 'ENGRAVED').toLowerCase(),
            zoneUV: {
              u: [zone.uvMinU, zone.uvMaxU],
              v: [zone.uvMinV, zone.uvMaxV],
            },
            modelUrl: prod.model3dUrl || prod.baseAssetUrl || '',
            productId: input.productId,
            zoneId: input.zoneId,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`AI Engine error: ${response.statusText}`);
            }

            const aiData = await response.json();

            await api.patch(`/api/v1/customizations/${customization.id}`, {
              status: 'COMPLETED',
              textureUrl: aiData.textureUrl,
              modelUrl: aiData.modelUrl,
              previewUrl: aiData.previewUrl,
              highResUrl: aiData.previewUrl,
              jobId: aiData.jobId,
              completedAt: new Date(),
              metadata: {
                processingTimeMs: aiData.processingTimeMs,
                cacheKey: aiData.cacheKey,
              },
            });

            logger.info('Customization completed', { customizationId: customization.id });
          })
          .catch(async (error) => {
            logger.error('AI Engine error', { error, customizationId: customization.id });

            await api.patch(`/api/v1/customizations/${customization.id}`, {
              status: 'FAILED',
              errorMessage: error.message,
            });
          });

        // Retourne immédiatement avec statut GENERATING
        return {
          id: customization.id,
          status: 'GENERATING',
          message: 'Génération en cours...',
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
        const customization = await api.get<any>(`/api/v1/customizations/${input.id}`).catch(() => null);

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        const user = await endpoints.auth.me() as { role?: string; brandId?: string };
        const c = customization as any;
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
        const result = await api.get<{ customizations?: any[]; data?: any[]; total?: number; pagination?: { total: number } }>('/api/v1/customizations', {
          params: {
            productId: input?.productId,
            status: input?.status,
            limit: input?.limit ?? 20,
            offset: input?.offset ?? 0,
          },
        });

        const customizations = (result as any).customizations ?? (result as any).data ?? [];
        const total = (result as any).pagination?.total ?? (result as any).total ?? (Array.isArray(customizations) ? customizations.length : 0);

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

        const customization = await api.get<any>(`/api/v1/customizations/${id}`).catch(() => null);

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        if ((customization as any).userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier cette personnalisation',
          });
        }

        const updated = await api.patch<any>(`/api/v1/customizations/${id}`, data);

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
        const customization = await api.get<any>(`/api/v1/customizations/${input.id}`).catch(() => null);

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        const c = customization as any;
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

        await api.delete(`/api/v1/customizations/${input.id}`);

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
        const customization = await api.get<any>(`/api/v1/customizations/${input.id}`).catch(() => null);

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        const c = customization as any;
        if (c.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas accès à cette personnalisation',
          });
        }

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

