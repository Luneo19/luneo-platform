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
import { db } from '@/lib/db';

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

        // Vérifie que le produit existe et appartient à la marque
        const product = await db.product.findUnique({
          where: { id: input.productId },
          include: { brand: true },
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        // Vérifie permissions (marque ou admin)
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
        });

        if (
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== product.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier ce produit',
          });
        }

        // Crée la zone
        const zone = await db.zone.create({
          data: {
            ...input,
            productId: input.productId,
          },
        });

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

        // Vérifie que la zone existe
        const zone = await db.zone.findUnique({
          where: { id },
          include: { product: { include: { brand: true } } },
        });

        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        // Vérifie permissions
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
        });

        if (
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== zone.product.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier cette zone',
          });
        }

        // Met à jour
        const updated = await db.zone.update({
          where: { id },
          data,
        });

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
        const zone = await db.zone.findUnique({
          where: { id: input.id },
          include: { product: { include: { brand: true } } },
        });

        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        // Vérifie permissions
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
        });

        if (
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== zone.product.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de supprimer cette zone',
          });
        }

        // Supprime
        await db.zone.delete({
          where: { id: input.id },
        });

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
        const zones = await db.zone.findMany({
          where: {
            productId: input.productId,
            isActive: true,
          },
          orderBy: { order: 'asc' },
        });

        return zones;
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

        // 1. Récupère produit et zone
        const product = await db.product.findUnique({
          where: { id: input.productId },
          include: {
            zones: true,
            brand: true,
          },
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        const zone = product.zones.find((z: any) => z.id === input.zoneId);
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

        // 3. Crée personnalisation en statut PENDING
        const customization = await db.customization.create({
          data: {
            prompt: input.prompt,
            zoneId: input.zoneId,
            productId: input.productId,
            userId: ctx.user.id,
            brandId: product.brandId,
            font: input.font || zone.defaultFont,
            color: input.color || zone.defaultColor || '#000000',
            size: input.size || zone.defaultSize || 24,
            effect: input.effect || 'ENGRAVED',
            orientation: input.orientation,
            options: input.options || {},
            status: 'GENERATING',
          },
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
            modelUrl: product.model3dUrl || product.baseAssetUrl || '',
            productId: input.productId,
            zoneId: input.zoneId,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`AI Engine error: ${response.statusText}`);
            }

            const aiData = await response.json();

            // Met à jour la personnalisation avec les résultats
            await db.customization.update({
              where: { id: customization.id },
              data: {
                status: 'COMPLETED',
                textureUrl: aiData.textureUrl,
                modelUrl: aiData.modelUrl,
                previewUrl: aiData.previewUrl,
                highResUrl: aiData.previewUrl, // Pour l'instant
                jobId: aiData.jobId,
                completedAt: new Date(),
                metadata: {
                  processingTimeMs: aiData.processingTimeMs,
                  cacheKey: aiData.cacheKey,
                },
              },
            });

            logger.info('Customization completed', { customizationId: customization.id });
          })
          .catch(async (error) => {
            logger.error('AI Engine error', { error, customizationId: customization.id });

            // Met à jour en statut FAILED
            await db.customization.update({
              where: { id: customization.id },
              data: {
                status: 'FAILED',
                errorMessage: error.message,
                retryCount: { increment: 1 },
              },
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
        const customization = await db.customization.findUnique({
          where: { id: input.id },
          include: {
            product: true,
            zone: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        // Vérifie permissions (propriétaire ou marque)
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
        });

        if (
          customization.userId !== ctx.user.id &&
          user?.role !== 'PLATFORM_ADMIN' &&
          user?.brandId !== customization.brandId
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
        const where: any = {
          userId: ctx.user.id,
        };

        if (input?.productId) {
          where.productId = input.productId;
        }

        if (input?.status) {
          where.status = input.status;
        }

        const [customizations, total] = await Promise.all([
          db.customization.findMany({
            where,
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
              zone: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: input?.limit || 20,
            skip: input?.offset || 0,
          }),
          db.customization.count({ where }),
        ]);

        return {
          customizations,
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

        const customization = await db.customization.findUnique({
          where: { id },
        });

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        // Vérifie permissions
        if (customization.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier cette personnalisation',
          });
        }

        const updated = await db.customization.update({
          where: { id },
          data,
        });

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
        const customization = await db.customization.findUnique({
          where: { id: input.id },
        });

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        // Vérifie permissions
        if (customization.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de supprimer cette personnalisation',
          });
        }

        // Supprime fichiers du stockage (async)
        const filesToDelete: string[] = [];
        if (customization.textureUrl) filesToDelete.push(customization.textureUrl);
        if (customization.modelUrl) filesToDelete.push(customization.modelUrl);
        if (customization.previewUrl) filesToDelete.push(customization.previewUrl);
        if (customization.highResUrl) filesToDelete.push(customization.highResUrl);
        if (customization.arModelUrl) filesToDelete.push(customization.arModelUrl);

        if (filesToDelete.length > 0) {
          const { deleteFilesFromStorage } = await import('@/lib/storage/storage-service');
          deleteFilesFromStorage(filesToDelete).catch((error) => {
            logger.error('Error deleting customization files from storage', { error, customizationId: input.id });
          });
        }

        // Supprime de la DB
        await db.customization.delete({
          where: { id: input.id },
        });

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
        const customization = await db.customization.findUnique({
          where: { id: input.id },
          select: {
            id: true,
            status: true,
            previewUrl: true,
            modelUrl: true,
            errorMessage: true,
            completedAt: true,
            userId: true,
          },
        });

        if (!customization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Personnalisation introuvable',
          });
        }

        // Vérifie permissions
        if (customization.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas accès à cette personnalisation',
          });
        }

        return customization;
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

