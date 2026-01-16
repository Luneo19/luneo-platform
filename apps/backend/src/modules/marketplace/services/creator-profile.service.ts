/**
 * @fileoverview Service de gestion des profils créateurs
 * @module CreatorProfileService
 *
 * Conforme au plan PHASE 7 - Marketplace & Communauté - Profils créateurs
 *
 * FONCTIONNALITÉS:
 * - Création et mise à jour de profils créateurs
 * - Gestion de la vérification
 * - Calcul des statistiques
 * - Intégration Stripe Connect
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Logging structuré
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Données de création de profil créateur
 */
export interface CreateCreatorProfileData {
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    dribbble?: string;
    behance?: string;
    linkedin?: string;
  };
}

/**
 * Données de mise à jour de profil créateur
 */
export interface UpdateCreatorProfileData {
  displayName?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    dribbble?: string;
    behance?: string;
    linkedin?: string;
  };
}

/**
 * Profil créateur complet
 */
export interface CreatorProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  verified: boolean;
  verifiedAt?: Date;
  status: 'active' | 'suspended' | 'banned';
  templatesCount: number;
  totalSales: number;
  totalEarningsCents: number;
  followersCount: number;
  followingCount: number;
  averageRating: number;
  stripeConnectId?: string;
  payoutEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class CreatorProfileService {
  private readonly logger = new Logger(CreatorProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Crée un profil créateur
   * Conforme au plan PHASE 7 - Profils créateurs
   */
  async createProfile(data: CreateCreatorProfileData): Promise<CreatorProfile> {
    // ✅ Validation
    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    if (!data.username || typeof data.username !== 'string' || data.username.trim().length === 0) {
      throw new BadRequestException('Username is required');
    }

    if (!data.displayName || typeof data.displayName !== 'string' || data.displayName.trim().length === 0) {
      throw new BadRequestException('Display name is required');
    }

    // ✅ Validation du format username (alphanumeric + underscore, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(data.username.trim())) {
      throw new BadRequestException('Username must be 3-30 characters, alphanumeric and underscores only');
    }

    // ✅ Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId.trim() },
    });

    if (!user) {
      throw new NotFoundException(`User ${data.userId} not found`);
    }

    // ✅ Vérifier que le username n'est pas déjà pris
    const existingProfile = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "CreatorProfile" WHERE "username" = ${data.username.trim()} LIMIT 1
    `;

    if (existingProfile && existingProfile.length > 0) {
      throw new BadRequestException('Username already taken');
    }

    try {
      // ✅ Créer le profil
      const profile = await this.prisma.$executeRaw`
        INSERT INTO "CreatorProfile" (
          "id", "userId", "username", "displayName", "bio", "avatar", "coverImage", "website", "socialLinks",
          "verified", "status", "templatesCount", "totalSales", "totalEarningsCents", "followersCount", 
          "followingCount", "averageRating", "payoutEnabled", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${data.userId.trim()},
          ${data.username.trim()},
          ${data.displayName.trim()},
          ${data.bio || null},
          ${data.avatar || null},
          ${data.coverImage || null},
          ${data.website || null},
          ${data.socialLinks ? JSON.stringify(data.socialLinks) : null}::jsonb,
          false,
          'active',
          0, 0, 0, 0, 0, 0.0, false,
          NOW(), NOW()
        )
        RETURNING *
      `;

      this.logger.log(`Creator profile created: ${data.username} for user ${data.userId}`);

      // ✅ Récupérer le profil créé
      return this.getProfileByUserId(data.userId.trim());
    } catch (error) {
      this.logger.error(
        `Failed to create creator profile: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient un profil par userId
   */
  async getProfileByUserId(userId: string): Promise<CreatorProfile> {
    // ✅ Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    const profile = await this.prisma.$queryRaw<CreatorProfile[]>`
      SELECT * FROM "CreatorProfile" WHERE "userId" = ${userId.trim()} LIMIT 1
    `;

    if (!profile || profile.length === 0) {
      throw new NotFoundException(`Creator profile not found for user ${userId}`);
    }

    return profile[0];
  }

  /**
   * Obtient un profil par username
   */
  async getProfileByUsername(username: string): Promise<CreatorProfile> {
    // ✅ Validation
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      throw new BadRequestException('Username is required');
    }

    const profile = await this.prisma.$queryRaw<CreatorProfile[]>`
      SELECT * FROM "CreatorProfile" WHERE "username" = ${username.trim()} LIMIT 1
    `;

    if (!profile || profile.length === 0) {
      throw new NotFoundException(`Creator profile not found for username ${username}`);
    }

    return profile[0];
  }

  /**
   * Met à jour un profil créateur
   */
  async updateProfile(userId: string, data: UpdateCreatorProfileData): Promise<CreatorProfile> {
    // ✅ Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    // ✅ Vérifier que le profil existe
    const existingProfile = await this.getProfileByUserId(userId.trim());

    try {
      // ✅ Construire la requête de mise à jour
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.displayName !== undefined) {
        updates.push(`"displayName" = $${paramIndex++}`);
        values.push(data.displayName.trim());
      }

      if (data.bio !== undefined) {
        updates.push(`"bio" = $${paramIndex++}`);
        values.push(data.bio || null);
      }

      if (data.avatar !== undefined) {
        updates.push(`"avatar" = $${paramIndex++}`);
        values.push(data.avatar || null);
      }

      if (data.coverImage !== undefined) {
        updates.push(`"coverImage" = $${paramIndex++}`);
        values.push(data.coverImage || null);
      }

      if (data.website !== undefined) {
        updates.push(`"website" = $${paramIndex++}`);
        values.push(data.website || null);
      }

      if (data.socialLinks !== undefined) {
        updates.push(`"socialLinks" = $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(data.socialLinks));
      }

      if (updates.length === 0) {
        return existingProfile; // Aucune mise à jour
      }

      updates.push(`"updatedAt" = NOW()`);
      values.push(userId.trim());

      // ✅ Exécuter la mise à jour
      await this.prisma.$executeRawUnsafe(
        `UPDATE "CreatorProfile" SET ${updates.join(', ')} WHERE "userId" = $${paramIndex}`,
        ...values,
      );

      this.logger.log(`Creator profile updated for user ${userId}`);

      // ✅ Retourner le profil mis à jour
      return this.getProfileByUserId(userId.trim());
    } catch (error) {
      this.logger.error(
        `Failed to update creator profile: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Met à jour les statistiques d'un profil
   */
  async updateStats(userId: string): Promise<void> {
    // ✅ Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    try {
      // ✅ Calculer les stats depuis les tables
      const stats = await this.prisma.$queryRaw<Array<{
        templatesCount: number;
        totalSales: number;
        totalEarningsCents: number;
        followersCount: number;
        followingCount: number;
        averageRating: number;
      }>>`
        SELECT
          (SELECT COUNT(*)::int FROM "MarketplaceTemplate" WHERE "creatorId" = cp."id" AND "status" = 'published') as "templatesCount",
          (SELECT COUNT(*)::int FROM "TemplatePurchase" WHERE "creatorId" = cp."id" AND "paymentStatus" = 'succeeded') as "totalSales",
          (SELECT COALESCE(SUM("creatorRevenueCents"), 0)::int FROM "TemplatePurchase" WHERE "creatorId" = cp."id" AND "paymentStatus" = 'succeeded') as "totalEarningsCents",
          (SELECT COUNT(*)::int FROM "CreatorFollow" WHERE "followingId" = cp."id") as "followersCount",
          (SELECT COUNT(*)::int FROM "CreatorFollow" WHERE "followerId" = cp."id") as "followingCount",
          (SELECT COALESCE(AVG("rating"), 0.0)::float FROM "TemplateReview" tr
           JOIN "MarketplaceTemplate" mt ON tr."templateId" = mt."id"
           WHERE mt."creatorId" = cp."id") as "averageRating"
        FROM "CreatorProfile" cp
        WHERE cp."userId" = ${userId.trim()}
        LIMIT 1
      `;

      if (stats && stats.length > 0) {
        const stat = stats[0];

        // ✅ Mettre à jour le profil
        await this.prisma.$executeRawUnsafe(
          `UPDATE "CreatorProfile" SET
            "templatesCount" = $1,
            "totalSales" = $2,
            "totalEarningsCents" = $3,
            "followersCount" = $4,
            "followingCount" = $5,
            "averageRating" = $6,
            "updatedAt" = NOW()
          WHERE "userId" = $7`,
          stat.templatesCount,
          stat.totalSales,
          stat.totalEarningsCents,
          stat.followersCount,
          stat.followingCount,
          stat.averageRating,
          userId.trim(),
        );

        this.logger.log(`Stats updated for creator profile ${userId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update creator stats: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      // Ne pas throw pour ne pas bloquer les autres opérations
    }
  }

  /**
   * Vérifie un créateur (admin)
   */
  async verifyCreator(userId: string, verified: boolean): Promise<CreatorProfile> {
    // ✅ Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "CreatorProfile" SET
          "verified" = $1,
          "verifiedAt" = ${verified ? 'NOW()' : 'NULL'},
          "updatedAt" = NOW()
        WHERE "userId" = $2`,
        verified,
        userId.trim(),
      );

      this.logger.log(`Creator ${userId} ${verified ? 'verified' : 'unverified'}`);

      return this.getProfileByUserId(userId.trim());
    } catch (error) {
      this.logger.error(
        `Failed to verify creator: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
