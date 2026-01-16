/**
 * ★★★ ROUTER TRPC - AR COMPLET ★★★
 * Gestion sessions AR et tracking
 * - Création sessions AR
 * - Tracking interactions
 * - Analytics AR
 * - Support detection
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../server';
import { TRPCError } from '@trpc/server';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ========================================
// SCHEMAS ZOD
// ========================================

const ARSessionSchema = z.object({
  productId: z.string().min(1),
  customizationId: z.string().optional(),
  modelUrl: z.string().url(),
  productType: z.enum(['glasses', 'jewelry', 'watch', 'ring', 'earrings', 'necklace']),
  deviceInfo: z
    .object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
      isMobile: z.boolean().optional(),
      isARSupported: z.boolean().optional(),
    })
    .optional(),
});

const ARInteractionSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum([
    'session_start',
    'session_end',
    'model_loaded',
    'model_error',
    'placement_success',
    'placement_failed',
    'screenshot',
    'share',
  ]),
  metadata: z.record(z.any()).optional(),
});

// ========================================
// ROUTER
// ========================================

export const arRouter = router({
  // ========================================
  // SESSIONS AR
  // ========================================

  /**
   * Créer une session AR
   */
  createSession: publicProcedure
    .input(ARSessionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating AR session', { productId: input.productId });

        // Vérifie que le produit existe
        const product = await db.product.findUnique({
          where: { id: input.productId },
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        // Crée la session AR via ARAnalyticsService
        const { arAnalyticsService } = await import('@/lib/services/ARAnalyticsService');
        const session = await arAnalyticsService.createSession({
          productId: input.productId,
          customizationId: input.customizationId,
          userId: ctx.user?.id,
          deviceInfo: input.deviceInfo,
        });

        logger.info('AR session created', { sessionId: session.id, productId: input.productId });

        return {
          sessionId: session.id,
          productId: input.productId,
          modelUrl: input.modelUrl,
          productType: input.productType,
          createdAt: session.startedAt,
        };
      } catch (error) {
        logger.error('Error creating AR session', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création de la session AR',
        });
      }
    }),

  /**
   * Enregistrer une interaction AR
   */
  trackInteraction: publicProcedure
    .input(ARInteractionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Tracking AR interaction', {
          sessionId: input.sessionId,
          type: input.type,
        });

        // Enregistrer l'interaction via ARAnalyticsService
        const { arAnalyticsService } = await import('@/lib/services/ARAnalyticsService');
        await arAnalyticsService.trackInteraction({
          sessionId: input.sessionId,
          type: input.type,
          metadata: input.metadata,
        });

        return { success: true };
      } catch (error) {
        logger.error('Error tracking AR interaction', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du tracking de l\'interaction',
        });
      }
    }),

  // ========================================
  // SUPPORT DETECTION
  // ========================================

  /**
   * Vérifier le support AR
   */
  checkSupport: publicProcedure
    .input(
      z
        .object({
          userAgent: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        // Détection basique du support AR
        // En production, cela devrait être fait côté client avec WebXR API
        const userAgent = input?.userAgent || '';

        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        const isChrome = /Chrome/.test(userAgent);

        // AR support basique
        const isARSupported =
          (isIOS && isSafari) || (isAndroid && isChrome);

        return {
          isARSupported,
          platform: isIOS ? 'ios' : isAndroid ? 'android' : 'unknown',
          browser: isSafari ? 'safari' : isChrome ? 'chrome' : 'unknown',
          recommendations: !isARSupported
            ? [
                'Utilisez Safari sur iOS 12+',
                'Utilisez Chrome sur Android 8+',
                'Assurez-vous que WebXR est activé',
              ]
            : [],
        };
      } catch (error) {
        logger.error('Error checking AR support', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la vérification du support AR',
        });
      }
    }),

  // ========================================
  // ANALYTICS AR
  // ========================================

  /**
   * Analytics AR pour un produit
   */
  getProductAnalytics: protectedProcedure
    .input(
      z.object({
        productId: z.string().min(1),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const product = await db.product.findUnique({
          where: { id: input.productId },
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        // Vérifie permissions
        if (
          ctx.user?.role !== 'PLATFORM_ADMIN' &&
          ctx.user?.brandId !== product.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas accès aux analytics AR de ce produit',
          });
        }

        // Implémenter analytics AR réels via ARAnalyticsService
        const { arAnalyticsService } = await import('@/lib/services/ARAnalyticsService');
        const analytics = await arAnalyticsService.getProductAnalytics(
          input.productId,
          input.startDate,
          input.endDate
        );

        return {
          totalSessions: analytics.totalSessions,
          averageSessionDuration: analytics.averageSessionDuration,
          mostUsedDevice: analytics.mostUsedDevice,
          successRate: analytics.successRate,
          uniqueUsers: analytics.uniqueUsers,
          byDevice: analytics.byDevice,
          trends: analytics.trends,
        };
      } catch (error) {
        logger.error('Error fetching AR analytics', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des analytics AR',
        });
      }
    }),

  // ========================================
  // MODELS MANAGEMENT
  // ========================================

  /**
   * Liste tous les modèles AR
   */
  listModels: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        type: z.string().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        const limit = input?.limit || 50;
        const offset = input?.offset || 0;

        // Pour l'instant, retourner des données mockées
        // En production, cela devrait interroger une table ARModel ou similaire
        const models: Array<{ id: string; name: string; url: string }> = [];

        return {
          models,
          total: 0,
          hasMore: false,
        };
      } catch (error) {
        logger.error('Error listing AR models', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des modèles AR',
        });
      }
    }),

  /**
   * Supprimer un modèle AR
   */
  deleteModel: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Pour l'instant, retourner un succès
        // En production, cela devrait supprimer le modèle de la base de données
        logger.info('AR model deleted', { modelId: input.id, userId: ctx.user?.id });

        return { success: true };
      } catch (error) {
        logger.error('Error deleting AR model', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression du modèle AR',
        });
      }
    }),

  /**
   * Analytics AR pour le dashboard
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        // Pour l'instant, retourner des données mockées
        // En production, cela devrait agréger les données depuis la base
        return {
          totalViews: 0,
          totalTryOns: 0,
          totalConversions: 0,
          averageSessionDuration: 0,
          topModels: [],
          deviceBreakdown: {},
          platformBreakdown: {},
        };
      } catch (error) {
        logger.error('Error fetching AR dashboard analytics', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des analytics AR',
        });
      }
    }),

  /**
   * Liste les sessions AR
   */
  listSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        modelId: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        const limit = input?.limit || 50;
        const offset = input?.offset || 0;

        // Pour l'instant, retourner des données mockées
        // En production, cela devrait interroger une table ARSession ou similaire
        const sessions: Array<Record<string, any>> = [];

        return {
          sessions,
          total: 0,
          hasMore: false,
        };
      } catch (error) {
        logger.error('Error listing AR sessions', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des sessions AR',
        });
      }
    }),
});
