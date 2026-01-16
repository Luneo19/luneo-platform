/**
 * ★★★ TRPC ROUTER - COLLABORATION ★★★
 * Router tRPC pour la collaboration (partage, commentaires)
 * Respecte les patterns existants du projet
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../server';

// ========================================
// SCHEMAS
// ========================================

const ResourceTypeSchema = z.enum([
  'ANALYTICS_REPORT',
  'AI_GENERATION',
  'DESIGN',
  'PRODUCT',
  'ORDER',
  'CUSTOMIZATION',
]);

const PermissionSchema = z.enum(['view', 'edit', 'delete', 'comment']);

const ShareResourceSchema = z.object({
  resourceType: ResourceTypeSchema,
  resourceId: z.string(),
  sharedWith: z.array(z.string()),
  permissions: z.record(z.string(), z.array(PermissionSchema)),
  isPublic: z.boolean().default(false),
});

// ========================================
// ROUTER
// ========================================

export const collaborationRouter = router({
  /**
   * Partage une ressource
   */
  shareResource: protectedProcedure
    .input(ShareResourceSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: { brandId: true },
        });

        if (!user?.brandId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous devez avoir une marque pour partager des ressources',
          });
        }

        // Créer la ressource partagée dans la base de données
        const sharedResource = await db.sharedResource.create({
          data: {
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            sharedWith: input.sharedWith,
            permissions: input.permissions as any,
            isPublic: input.isPublic,
            publicToken: input.isPublic ? `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null,
            createdBy: ctx.user.id,
            brandId: user.brandId,
          },
        });

        return {
          success: true,
          sharedResource: {
            id: sharedResource.id,
            resourceType: sharedResource.resourceType,
            resourceId: sharedResource.resourceId,
            sharedWith: sharedResource.sharedWith,
            permissions: sharedResource.permissions as any,
            isPublic: sharedResource.isPublic,
            publicToken: sharedResource.publicToken,
            createdBy: sharedResource.createdBy,
            brandId: sharedResource.brandId,
            createdAt: sharedResource.createdAt,
            updatedAt: sharedResource.updatedAt,
          },
        };
      } catch (error) {
        logger.error('Failed to share resource', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du partage de la ressource',
        });
      }
    }),

  /**
   * Récupère les ressources partagées
   */
  getSharedResources: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: { brandId: true },
      });

      if (!user?.brandId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous devez avoir une marque pour partager des ressources',
        });
      }

        // Récupérer les ressources partagées avec l'utilisateur
        const resources = await db.sharedResource.findMany({
          where: {
            brandId: user.brandId,
            OR: [
              { sharedWith: { has: ctx.user.id } },
              { createdBy: ctx.user.id },
              { isPublic: true },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          success: true,
          resources: resources.map((resource: any) => ({
            id: resource.id,
            resourceType: resource.resourceType,
            resourceId: resource.resourceId,
            sharedWith: resource.sharedWith,
            permissions: resource.permissions as any,
            isPublic: resource.isPublic,
            publicToken: resource.publicToken,
            createdBy: resource.createdBy,
            brandId: resource.brandId,
            createdAt: resource.createdAt,
            updatedAt: resource.updatedAt,
          })),
        };
      } catch (error) {
        logger.error('Failed to get shared resources', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des ressources partagées',
        });
      }
  }),

  /**
   * Ajoute un commentaire
   */
  addComment: protectedProcedure
    .input(
      z.object({
        resourceType: ResourceTypeSchema,
        resourceId: z.string(),
        content: z.string(),
        parentId: z.string().optional(),
        sharedResourceId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Récupérer l'utilisateur pour les infos de l'auteur
        const author = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: { id: true, email: true, firstName: true, lastName: true },
        });

        // Créer le commentaire dans la base de données
        const comment = await db.comment.create({
          data: {
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            content: input.content,
            parentId: input.parentId,
            authorId: ctx.user.id,
            sharedResourceId: input.sharedResourceId,
          },
        });

        return {
          success: true,
          comment: {
            id: comment.id,
            resourceType: comment.resourceType,
            resourceId: comment.resourceId,
            content: comment.content,
            parentId: comment.parentId,
            authorId: comment.authorId,
            author: {
              id: author?.id || ctx.user.id,
              name: author ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email : ctx.user.email,
              email: author?.email || ctx.user.email,
            },
            sharedResourceId: comment.sharedResourceId,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
          },
        };
      } catch (error) {
        logger.error('Failed to add comment', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'ajout du commentaire',
        });
      }
    }),

  /**
   * Récupère les commentaires d'une ressource
   */
  getComments: protectedProcedure
    .input(
      z.object({
        resourceType: ResourceTypeSchema,
        resourceId: z.string(),
        sharedResourceId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        // Récupérer les commentaires depuis la base de données
        const comments = await db.comment.findMany({
          where: {
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            sharedResourceId: input.sharedResourceId,
          },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return {
          success: true,
          comments: comments
            .filter((c: any) => !c.parentId) // Seulement les commentaires racine
            .map((comment: any) => ({
              id: comment.id,
              resourceType: comment.resourceType,
              resourceId: comment.resourceId,
              content: comment.content,
              parentId: comment.parentId,
              authorId: comment.authorId,
              author: {
                id: comment.author.id,
                name: `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() || comment.author.email,
                email: comment.author.email,
                avatar: comment.author.avatar,
              },
              sharedResourceId: comment.sharedResourceId,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt,
              replies: (comment.replies as any[]).map((reply: any) => ({
                id: reply.id,
                resourceType: reply.resourceType,
                resourceId: reply.resourceId,
                content: reply.content,
                parentId: reply.parentId,
                authorId: reply.authorId,
                author: {
                  id: reply.author.id,
                  name: `${reply.author.firstName || ''} ${reply.author.lastName || ''}`.trim() || reply.author.email,
                  email: reply.author.email,
                  avatar: reply.author.avatar,
                },
                sharedResourceId: reply.sharedResourceId,
                createdAt: reply.createdAt,
                updatedAt: reply.updatedAt,
              })),
            })),
        };
      } catch (error) {
        logger.error('Failed to get comments', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des commentaires',
        });
      }
    }),
});

