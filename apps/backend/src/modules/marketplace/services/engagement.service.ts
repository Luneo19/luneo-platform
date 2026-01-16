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

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
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
   */
  async toggleLike(templateId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    // ✅ Validation
    if (!templateId || typeof templateId !== 'string' || templateId.trim().length === 0) {
      throw new BadRequestException('Template ID is required');
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    try {
      // ✅ Vérifier si le like existe déjà
      const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "TemplateLike" WHERE "templateId" = $1 AND "userId" = $2 LIMIT 1`,
        templateId.trim(),
        userId.trim(),
      );

      if (existing && existing.length > 0) {
        // ✅ Unlike: supprimer le like
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM "TemplateLike" WHERE "templateId" = $1 AND "userId" = $2`,
          templateId.trim(),
          userId.trim(),
        );

        // ✅ Décrémenter le compteur
        await this.prisma.$executeRawUnsafe(
          `UPDATE "MarketplaceTemplate" SET "likes" = GREATEST("likes" - 1, 0) WHERE "id" = $1`,
          templateId.trim(),
        );

        // ✅ Récupérer le nouveau count
        const countResult = await this.prisma.$queryRawUnsafe<Array<{ likes: number }>>(
          `SELECT "likes" FROM "MarketplaceTemplate" WHERE "id" = $1 LIMIT 1`,
          templateId.trim(),
        );

        this.logger.log(`Template ${templateId} unliked by user ${userId}`);

        return {
          liked: false,
          likesCount: countResult[0]?.likes || 0,
        };
      } else {
        // ✅ Like: créer le like
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "TemplateLike" ("id", "templateId", "userId", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
          templateId.trim(),
          userId.trim(),
        );

        // ✅ Incrémenter le compteur
        await this.prisma.$executeRawUnsafe(
          `UPDATE "MarketplaceTemplate" SET "likes" = "likes" + 1 WHERE "id" = $1`,
          templateId.trim(),
        );

        // ✅ Récupérer le nouveau count
        const countResult = await this.prisma.$queryRawUnsafe<Array<{ likes: number }>>(
          `SELECT "likes" FROM "MarketplaceTemplate" WHERE "id" = $1 LIMIT 1`,
          templateId.trim(),
        );

        this.logger.log(`Template ${templateId} liked by user ${userId}`);

        return {
          liked: true,
          likesCount: countResult[0]?.likes || 0,
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

    try {
      // ✅ Vérifier si le follow existe déjà
      const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "CreatorFollow" WHERE "followerId" = $1 AND "followingId" = $2 LIMIT 1`,
        followerId.trim(),
        followingId.trim(),
      );

      if (existing && existing.length > 0) {
        // ✅ Unfollow: supprimer le follow
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM "CreatorFollow" WHERE "followerId" = $1 AND "followingId" = $2`,
          followerId.trim(),
          followingId.trim(),
        );

        // ✅ Décrémenter le compteur
        await this.prisma.$executeRawUnsafe(
          `UPDATE "CreatorProfile" SET "followersCount" = GREATEST("followersCount" - 1, 0) WHERE "id" = $1`,
          followingId.trim(),
        );

        // ✅ Récupérer le nouveau count
        const countResult = await this.prisma.$queryRawUnsafe<Array<{ followersCount: number }>>(
          `SELECT "followersCount" FROM "CreatorProfile" WHERE "id" = $1 LIMIT 1`,
          followingId.trim(),
        );

        this.logger.log(`Creator ${followingId} unfollowed by user ${followerId}`);

        return {
          following: false,
          followersCount: countResult[0]?.followersCount || 0,
        };
      } else {
        // ✅ Follow: créer le follow
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "CreatorFollow" ("id", "followerId", "followingId", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
          followerId.trim(),
          followingId.trim(),
        );

        // ✅ Incrémenter le compteur
        await this.prisma.$executeRawUnsafe(
          `UPDATE "CreatorProfile" SET "followersCount" = "followersCount" + 1 WHERE "id" = $1`,
          followingId.trim(),
        );

        // ✅ Récupérer le nouveau count
        const countResult = await this.prisma.$queryRawUnsafe<Array<{ followersCount: number }>>(
          `SELECT "followersCount" FROM "CreatorProfile" WHERE "id" = $1 LIMIT 1`,
          followingId.trim(),
        );

        this.logger.log(`Creator ${followingId} followed by user ${followerId}`);

        return {
          following: true,
          followersCount: countResult[0]?.followersCount || 0,
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

    try {
      // ✅ Vérifier si une review existe déjà
      const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "TemplateReview" WHERE "templateId" = $1 AND "userId" = $2 LIMIT 1`,
        data.templateId.trim(),
        data.userId.trim(),
      );

      if (existing && existing.length > 0) {
        // ✅ Mettre à jour la review existante
        await this.prisma.$executeRawUnsafe(
          `UPDATE "TemplateReview" SET
            "rating" = $1,
            "comment" = $2,
            "updatedAt" = NOW()
          WHERE "id" = $3`,
          data.rating,
          data.comment || null,
          existing[0].id,
        );

        // ✅ Recalculer la moyenne des ratings
        await this.updateTemplateRating(data.templateId.trim());

        // ✅ Récupérer la review mise à jour
        const reviews = await this.prisma.$queryRawUnsafe<TemplateReview[]>(
          `SELECT * FROM "TemplateReview" WHERE "id" = $1 LIMIT 1`,
          existing[0].id,
        );

        this.logger.log(`Review updated for template ${data.templateId} by user ${data.userId}`);

        return reviews[0];
      } else {
        // ✅ Créer une nouvelle review
        const review = await this.prisma.$executeRawUnsafe(
          `INSERT INTO "TemplateReview" (
            "id", "templateId", "userId", "purchaseId", "rating", "comment", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW()
          )
          RETURNING *`,
          data.templateId.trim(),
          data.userId.trim(),
          data.purchaseId || null,
          data.rating,
          data.comment || null,
        );

        // ✅ Incrémenter le compteur de reviews
        await this.prisma.$executeRawUnsafe(
          `UPDATE "MarketplaceTemplate" SET "reviews" = "reviews" + 1 WHERE "id" = $1`,
          data.templateId.trim(),
        );

        // ✅ Recalculer la moyenne des ratings
        await this.updateTemplateRating(data.templateId.trim());

        this.logger.log(`Review created for template ${data.templateId} by user ${data.userId}`);

        return (review as any)[0];
      }
    } catch (error) {
      this.logger.error(
        `Failed to create/update review: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Ajoute/retire un template des favoris
   */
  async toggleFavorite(templateId: string, userId: string): Promise<{ favorited: boolean }> {
    // ✅ Validation
    if (!templateId || typeof templateId !== 'string' || templateId.trim().length === 0) {
      throw new BadRequestException('Template ID is required');
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    try {
      // ✅ Vérifier si le favorite existe déjà
      const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "TemplateFavorite" WHERE "templateId" = $1 AND "userId" = $2 LIMIT 1`,
        templateId.trim(),
        userId.trim(),
      );

      if (existing && existing.length > 0) {
        // ✅ Retirer des favoris
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM "TemplateFavorite" WHERE "templateId" = $1 AND "userId" = $2`,
          templateId.trim(),
          userId.trim(),
        );

        this.logger.log(`Template ${templateId} removed from favorites by user ${userId}`);

        return { favorited: false };
      } else {
        // ✅ Ajouter aux favoris
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "TemplateFavorite" ("id", "templateId", "userId", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
          templateId.trim(),
          userId.trim(),
        );

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
   */
  private async updateTemplateRating(templateId: string): Promise<void> {
    try {
      const ratingResult = await this.prisma.$queryRawUnsafe<Array<{ averageRating: number }>>(
        `SELECT COALESCE(AVG("rating"), 0.0)::float as "averageRating"
         FROM "TemplateReview" WHERE "templateId" = $1`,
        templateId.trim(),
      );

      if (ratingResult && ratingResult.length > 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE "MarketplaceTemplate" SET "averageRating" = $1 WHERE "id" = $2`,
          ratingResult[0].averageRating,
          templateId.trim(),
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update template rating: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      // Ne pas throw pour ne pas bloquer les autres opérations
    }
  }
}
