/**
 * ★★★ TRPC ROUTER - COLLABORATION ★★★
 * Router tRPC pour la collaboration (partage, commentaires)
 * Respecte les patterns existants du projet
 */

import { api, endpoints } from '@/lib/api/client';
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
        const user = await endpoints.auth.me() as { brandId?: string };
        if (!user?.brandId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous devez avoir une marque pour partager des ressources',
          });
        }

        type ShareResourceResponse = { id: string; resourceType?: string; resourceId?: string; sharedWith?: string[]; permissions?: Record<string, string[]>; isPublic?: boolean; publicToken?: string; createdBy?: string; brandId?: string; createdAt?: unknown; updatedAt?: unknown };
        const sharedResource = await api.post<ShareResourceResponse>('/api/v1/collaboration/share', {
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          sharedWith: input.sharedWith,
          permissions: input.permissions,
          isPublic: input.isPublic,
        });

        return {
          success: true,
          sharedResource: {
            id: sharedResource.id,
            resourceType: sharedResource.resourceType ?? input.resourceType,
            resourceId: sharedResource.resourceId ?? input.resourceId,
            sharedWith: sharedResource.sharedWith ?? input.sharedWith,
            permissions: sharedResource.permissions ?? input.permissions,
            isPublic: sharedResource.isPublic ?? input.isPublic,
            publicToken: sharedResource.publicToken,
            createdBy: sharedResource.createdBy ?? ctx.user.id,
            brandId: sharedResource.brandId ?? user.brandId,
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
      const user = await endpoints.auth.me() as { brandId?: string };
      if (!user?.brandId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous devez avoir une marque pour partager des ressources',
        });
      }

        const response = await api.get<{ resources?: unknown[]; data?: unknown[] } | unknown[]>('/api/v1/collaboration/shared');
        const resRaw = response as { resources?: unknown[]; data?: unknown[] } | unknown[];
        const resources = Array.isArray(resRaw) ? resRaw : (resRaw?.resources ?? resRaw?.data ?? []);

        type ResourceLike = { id: string; resourceType: string; resourceId: string; sharedWith: string[]; permissions?: Record<string, string[]>; isPublic?: boolean; publicToken?: string; createdBy?: string; brandId?: string; createdAt?: unknown; updatedAt?: unknown };
        return {
          success: true,
          resources: (resources as ResourceLike[]).map((resource) => ({
            id: resource.id,
            resourceType: resource.resourceType,
            resourceId: resource.resourceId,
            sharedWith: resource.sharedWith,
            permissions: resource.permissions ?? {},
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
        const author = await endpoints.auth.me() as { id?: string; name?: string; firstName?: string; lastName?: string; email?: string } | null;
        type CommentResponse = { id: string; resourceType?: string; resourceId?: string; content?: string; parentId?: string; authorId?: string; sharedResourceId?: string; createdAt?: unknown; updatedAt?: unknown };
        const comment = await api.post<CommentResponse>('/api/v1/collaboration/comments', {
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          content: input.content,
          parentId: input.parentId,
          sharedResourceId: input.sharedResourceId,
        });

        return {
          success: true,
          comment: {
            id: comment.id,
            resourceType: comment.resourceType ?? input.resourceType,
            resourceId: comment.resourceId ?? input.resourceId,
            content: comment.content ?? input.content,
            parentId: comment.parentId ?? input.parentId,
            authorId: comment.authorId ?? ctx.user.id,
            author: {
              id: author?.id ?? ctx.user.id,
              name: author?.name ?? (author ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email : '') ?? ctx.user.email,
              email: author?.email ?? ctx.user.email,
            },
            sharedResourceId: comment.sharedResourceId ?? input.sharedResourceId,
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
        const response = await api.get<Record<string, unknown>>('/api/v1/collaboration/comments', {
          params: {
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            sharedResourceId: input.sharedResourceId,
          },
        });
        const responseRecord = response as Record<string, unknown> | unknown[];
        const comments = Array.isArray(responseRecord) ? responseRecord : ((responseRecord as Record<string, unknown>)?.comments ?? (responseRecord as Record<string, unknown>)?.data ?? []);

        return {
          success: true,
          comments: (Array.isArray(comments) ? comments : [])
            .filter((c: Record<string, unknown>) => !c.parentId) // Seulement les commentaires racine
            .map((comment: Record<string, unknown>) => {
              const cAuthor = comment.author as { id?: string; firstName?: string; lastName?: string; email?: string; avatar?: string } | null | undefined;
              return {
              id: comment.id,
              resourceType: comment.resourceType,
              resourceId: comment.resourceId,
              content: comment.content,
              parentId: comment.parentId,
              authorId: comment.authorId,
              author: {
                id: cAuthor?.id ?? comment.authorId,
                name: cAuthor ? `${cAuthor.firstName || ''} ${cAuthor.lastName || ''}`.trim() || cAuthor.email : '',
                email: cAuthor?.email ?? '',
                avatar: cAuthor?.avatar,
              },
              sharedResourceId: comment.sharedResourceId,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt,
              replies: (Array.isArray(comment.replies) ? comment.replies : []).map((reply: Record<string, unknown>) => {
                const rAuthor = reply.author as { id?: string; firstName?: string; lastName?: string; email?: string; avatar?: string } | null | undefined;
                return {
                id: reply.id,
                resourceType: reply.resourceType,
                resourceId: reply.resourceId,
                content: reply.content,
                parentId: reply.parentId,
                authorId: reply.authorId,
                author: {
                    id: rAuthor?.id ?? reply.authorId,
                    name: rAuthor ? (`${rAuthor.firstName || ''} ${rAuthor.lastName || ''}`.trim() || (rAuthor.email ?? '')) : '',
                    email: rAuthor?.email ?? '',
                    avatar: rAuthor?.avatar,
                  },
                sharedResourceId: reply.sharedResourceId,
                createdAt: reply.createdAt,
                updatedAt: reply.updatedAt,
              };
            }),
              };
            }),
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

