/**
 * @fileoverview Service d'engagement (likes, follows, reviews, favorites)
 * @module EngagementService
 *
 * Conforme au plan PHASE 7 - Marketplace & Communauté - Engagement
 *
 * FONCTIONNALITÉS:
 * - Likes de templates
 * - Follows de créateurs
 * - Reviews de templates
 * - Favorites de templates
 * - Calcul des statistiques d'engagement
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Logging structuré
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Données de review
 */
export interface CreateReviewData {
  templateId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  purchaseId?: string;
}

/**
 * Review
 */
export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  purchaseId?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Like/unlike un template
   * Conforme au plan PHASE 7 - Engagement
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async toggleLike(templateId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    // ✅ Validation
    if (!templateId || typeof templateId !== 'string' || templateId.trim().length === 0) {
      throw new BadRequestException('Template ID is required');
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    const cleanTemplateId = templateId.trim();
    const cleanUserId = userId.trim();

    try {
      // ✅ Vérifier si le like existe déjà (utilise contrainte unique)
      const existing = await this.prisma.templateLike.findUnique({
        where: {
          templateId_userId: {
            templateId: cleanTemplateId,
            userId: cleanUserId,
          },
        },
      });

      if (existing) {
        // ✅ Unlike: supprimer le like
        await this.prisma.templateLike.delete({
          where: {
            templateId_userId: {
              templateId: cleanTemplateId,
              userId: cleanUserId,
            },
          },
        });

        // ✅ Décrémenter le compteur (avec protection contre les valeurs négatives)
        const template = await this.prisma.marketplaceTemplate.update({
          where: { id: cleanTemplateId },
          data: {
            likes: { decrement: 1 },
          },
          select: { likes: true },
        });

        // ✅ S'assurer que likes n'est pas négatif
        if (template.likes < 0) {
          await this.prisma.marketplaceTemplate.update({
            where: { id: cleanTemplateId },
            data: { likes: 0 },
          });
        }

        this.logger.log(`Template ${templateId} unliked by user ${userId}`);

        return {
          liked: false,
          likesCount: Math.max(0, template.likes),
        };
      } else {
        // ✅ Like: créer le like
        await this.prisma.templateLike.create({
          data: {
            templateId: cleanTemplateId,
            userId: cleanUserId,
          },
        });

        // ✅ Incrémenter le compteur
        const template = await this.prisma.marketplaceTemplate.update({
          where: { id: cleanTemplateId },
          data: {
            likes: { increment: 1 },
          },
          select: { likes: true },
        });

        this.logger.log(`Template ${templateId} liked by user ${userId}`);

        return {
          liked: true,
          likesCount: template.likes,
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to toggle like: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Follow/unfollow un créateur
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean; followersCount: number }> {
    // ✅ Validation
    if (!followerId || typeof followerId !== 'string' || followerId.trim().length === 0) {
      throw new BadRequestException('Follower ID is required');
    }

    if (!followingId || typeof followingId !== 'string' || followingId.trim().length === 0) {
      throw new BadRequestException('Following ID is required');
    }

    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const cleanFollowerId = followerId.trim();
    const cleanFollowingId = followingId.trim();

    try {
      // ✅ Vérifier si le follow existe déjà (utilise contrainte unique)
      const existing = await this.prisma.creatorFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: cleanFollowerId,
            followingId: cleanFollowingId,
          },
        },
      });

      if (existing) {
        // ✅ Unfollow: supprimer le follow
        await this.prisma.creatorFollow.delete({
          where: {
            followerId_followingId: {
              followerId: cleanFollowerId,
              followingId: cleanFollowingId,
            },
          },
        });

        // ✅ Décrémenter le compteur
        const profile = await this.prisma.creatorProfile.update({
          where: { id: cleanFollowingId },
          data: {
            followersCount: { decrement: 1 },
          },
          select: { followersCount: true },
        });

        // ✅ S'assurer que followersCount n'est pas négatif
        if (profile.followersCount < 0) {
          await this.prisma.creatorProfile.update({
            where: { id: cleanFollowingId },
            data: { followersCount: 0 },
          });
        }

        this.logger.log(`Creator ${followingId} unfollowed by user ${followerId}`);

        return {
          following: false,
          followersCount: Math.max(0, profile.followersCount),
        };
      } else {
        // ✅ Follow: créer le follow
        await this.prisma.creatorFollow.create({
          data: {
            followerId: cleanFollowerId,
            followingId: cleanFollowingId,
          },
        });

        // ✅ Incrémenter le compteur
        const profile = await this.prisma.creatorProfile.update({
          where: { id: cleanFollowingId },
          data: {
            followersCount: { increment: 1 },
          },
          select: { followersCount: true },
        });

        this.logger.log(`Creator ${followingId} followed by user ${followerId}`);

        return {
          following: true,
          followersCount: profile.followersCount,
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to toggle follow: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Crée ou met à jour une review
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async createOrUpdateReview(data: CreateReviewData): Promise<TemplateReview> {
    // ✅ Validation
    if (!data.templateId || typeof data.templateId !== 'string' || data.templateId.trim().length === 0) {
      throw new BadRequestException('Template ID is required');
    }

    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const cleanTemplateId = data.templateId.trim();
    const cleanUserId = data.userId.trim();

    try {
      // ✅ Upsert la review (créer ou mettre à jour)
      const review = await this.prisma.templateReview.upsert({
        where: {
          templateId_userId: {
            templateId: cleanTemplateId,
            userId: cleanUserId,
          },
        },
        update: {
          rating: data.rating,
          comment: data.comment || null,
        },
        create: {
          templateId: cleanTemplateId,
          userId: cleanUserId,
          purchaseId: data.purchaseId || null,
          rating: data.rating,
          comment: data.comment || null,
        },
      });

      // ✅ Recalculer la moyenne des ratings
      await this.updateTemplateRating(cleanTemplateId);

      // ✅ Mettre à jour le compteur de reviews
      const reviewCount = await this.prisma.templateReview.count({
        where: { templateId: cleanTemplateId },
      });

      await this.prisma.marketplaceTemplate.update({
        where: { id: cleanTemplateId },
        data: { reviews: reviewCount },
      });

      this.logger.log(`Review saved for template ${data.templateId} by user ${data.userId}`);

      return review as TemplateReview;
    } catch (error) {
      this.logger.error(
        `Failed to create/update review: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Ajoute/retire un template des favoris
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async toggleFavorite(templateId: string, userId: string): Promise<{ favorited: boolean }> {
    // ✅ Validation
    if (!templateId || typeof templateId !== 'string' || templateId.trim().length === 0) {
      throw new BadRequestException('Template ID is required');
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    const cleanTemplateId = templateId.trim();
    const cleanUserId = userId.trim();

    try {
      // ✅ Vérifier si le favorite existe déjà (utilise contrainte unique)
      const existing = await this.prisma.templateFavorite.findUnique({
        where: {
          templateId_userId: {
            templateId: cleanTemplateId,
            userId: cleanUserId,
          },
        },
      });

      if (existing) {
        // ✅ Retirer des favoris
        await this.prisma.templateFavorite.delete({
          where: {
            templateId_userId: {
              templateId: cleanTemplateId,
              userId: cleanUserId,
            },
          },
        });

        this.logger.log(`Template ${templateId} removed from favorites by user ${userId}`);

        return { favorited: false };
      } else {
        // ✅ Ajouter aux favoris
        await this.prisma.templateFavorite.create({
          data: {
            templateId: cleanTemplateId,
            userId: cleanUserId,
          },
        });

        this.logger.log(`Template ${templateId} added to favorites by user ${userId}`);

        return { favorited: true };
      }
    } catch (error) {
      this.logger.error(
        `Failed to toggle favorite: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Met à jour la moyenne des ratings d'un template
   * SEC-11: Utilise méthodes Prisma aggregate au lieu de $queryRawUnsafe
   */
  private async updateTemplateRating(templateId: string): Promise<void> {
    try {
      const cleanTemplateId = templateId.trim();

      // ✅ Calculer la moyenne avec Prisma aggregate
      const result = await this.prisma.templateReview.aggregate({
        where: { templateId: cleanTemplateId },
        _avg: { rating: true },
      });

      const averageRating = result._avg.rating || 0;

      // ✅ Mettre à jour le template
      await this.prisma.marketplaceTemplate.update({
        where: { id: cleanTemplateId },
        data: { averageRating },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update template rating: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      // Ne pas throw pour ne pas bloquer les autres opérations
    }
  }
}
