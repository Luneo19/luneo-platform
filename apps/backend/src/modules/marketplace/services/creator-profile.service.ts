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
 * - ✅ SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { Prisma } from '@prisma/client';

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
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRaw
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
    const cleanUsername = data.username.trim();
    if (!usernameRegex.test(cleanUsername)) {
      throw new BadRequestException('Username must be 3-30 characters, alphanumeric and underscores only');
    }

    const cleanUserId = data.userId.trim();

    // ✅ Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: cleanUserId },
    });

    if (!user) {
      throw new NotFoundException(`User ${data.userId} not found`);
    }

    // ✅ Vérifier que le username n'est pas déjà pris (contrainte unique)
    const existingProfile = await this.prisma.creatorProfile.findUnique({
      where: { username: cleanUsername },
    });

    if (existingProfile) {
      throw new BadRequestException('Username already taken');
    }

    try {
      // ✅ Créer le profil avec Prisma
      const profile = await this.prisma.creatorProfile.create({
        data: {
          userId: cleanUserId,
          username: cleanUsername,
          displayName: data.displayName.trim(),
          bio: data.bio || null,
          avatar: data.avatar || null,
          coverImage: data.coverImage || null,
          website: data.website || null,
          socialLinks: data.socialLinks ? (data.socialLinks as Prisma.JsonObject) : Prisma.JsonNull,
          verified: false,
          status: 'active',
          templatesCount: 0,
          totalSales: 0,
          totalEarningsCents: 0,
          followersCount: 0,
          followingCount: 0,
          averageRating: 0.0,
          payoutEnabled: false,
        },
      });

      this.logger.log(`Creator profile created: ${data.username} for user ${data.userId}`);

      return profile as unknown as CreatorProfile;
    } catch (error) {
      this.logger.error(
        `Failed to create creator profile: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient un profil par userId
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRaw
   */
  async getProfileByUserId(userId: string): Promise<CreatorProfile> {
    // ✅ Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId: userId.trim() },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found for user ${userId}`);
    }

    return profile as unknown as CreatorProfile;
  }

  /**
   * Obtient un profil par username
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRaw
   */
  async getProfileByUsername(username: string): Promise<CreatorProfile> {
    // ✅ Validation
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      throw new BadRequestException('Username is required');
    }

    const profile = await this.prisma.creatorProfile.findUnique({
      where: { username: username.trim() },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found for username ${username}`);
    }

    return profile as unknown as CreatorProfile;
  }

  /**
   * Met à jour un profil créateur
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRawUnsafe
   */
  async updateProfile(userId: string, data: UpdateCreatorProfileData): Promise<CreatorProfile> {
    // ✅ Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    const cleanUserId = userId.trim();

    // ✅ Vérifier que le profil existe
    const existingProfile = await this.getProfileByUserId(cleanUserId);

    try {
      // ✅ Construire les données de mise à jour
      const updateData: Prisma.CreatorProfileUpdateInput = {};

      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName.trim();
      }

      if (data.bio !== undefined) {
        updateData.bio = data.bio || null;
      }

      if (data.avatar !== undefined) {
        updateData.avatar = data.avatar || null;
      }

      if (data.coverImage !== undefined) {
        updateData.coverImage = data.coverImage || null;
      }

      if (data.website !== undefined) {
        updateData.website = data.website || null;
      }

      if (data.socialLinks !== undefined) {
        updateData.socialLinks = data.socialLinks ? (data.socialLinks as Prisma.JsonObject) : Prisma.JsonNull;
      }

      // ✅ Si rien à mettre à jour, retourner le profil existant
      if (Object.keys(updateData).length === 0) {
        return existingProfile;
      }

      // ✅ Mettre à jour avec Prisma
      const profile = await this.prisma.creatorProfile.update({
        where: { userId: cleanUserId },
        data: updateData,
      });

      this.logger.log(`Creator profile updated for user ${userId}`);

      return profile as unknown as CreatorProfile;
    } catch (error) {
      this.logger.error(
        `Failed to update creator profile: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient les statistiques d'un créateur avec cache Redis
   * PERF-04: Cache avec TTL 1h pour réduire les requêtes DB
   */
  async getCreatorStats(userId: string): Promise<{
    templatesCount: number;
    totalSales: number;
    totalEarningsCents: number;
    followersCount: number;
    followingCount: number;
    averageRating: number;
  }> {
    // ✅ Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    const cleanUserId = userId.trim();
    const cacheKey = `creator-stats:${cleanUserId}`;

    // PERF-04: Utiliser le cache avec TTL 1h (3600s)
    const cachedStats = await this.cache.get(
      cacheKey,
      'user', // Utilise la stratégie 'user' avec TTL 1800s, on override à 3600
      async () => {
        const profile = await this.prisma.creatorProfile.findUnique({
          where: { userId: cleanUserId },
          select: {
            templatesCount: true,
            totalSales: true,
            totalEarningsCents: true,
            followersCount: true,
            followingCount: true,
            averageRating: true,
          },
        });

        if (!profile) {
          return null;
        }

        return {
          templatesCount: profile.templatesCount,
          totalSales: profile.totalSales,
          totalEarningsCents: profile.totalEarningsCents,
          followersCount: profile.followersCount,
          followingCount: profile.followingCount,
          averageRating: profile.averageRating ?? 0,
        };
      },
      { ttl: 3600, tags: [`creator:${cleanUserId}`] },
    );

    if (!cachedStats) {
      throw new NotFoundException(`Creator profile not found for user ${userId}`);
    }

    return cachedStats;
  }

  /**
   * Met à jour les statistiques d'un profil
   * SEC-11: Utilise méthodes Prisma au lieu de raw queries
   * PERF-04: Invalide le cache après mise à jour
   */
  async updateStats(userId: string): Promise<void> {
    // ✅ Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    const cleanUserId = userId.trim();

    try {
      // ✅ Récupérer le profil pour obtenir l'id
      const profile = await this.prisma.creatorProfile.findUnique({
        where: { userId: cleanUserId },
        select: { id: true },
      });

      if (!profile) {
        this.logger.warn(`Creator profile not found for user ${userId}`);
        return;
      }

      // ✅ Calculer les stats avec des requêtes Prisma parallèles
      const [templatesCount, salesData, followersCount, followingCount, ratingsData] = await Promise.all([
        // Templates publiés
        this.prisma.marketplaceTemplate.count({
          where: { creatorId: profile.id, status: 'published' },
        }),
        // Ventes et revenus
        this.prisma.templatePurchase.aggregate({
          where: { creatorId: profile.id, paymentStatus: 'succeeded' },
          _count: true,
          _sum: { creatorRevenueCents: true },
        }),
        // Followers
        this.prisma.creatorFollow.count({
          where: { followingId: profile.id },
        }),
        // Following
        this.prisma.creatorFollow.count({
          where: { followerId: profile.id },
        }),
        // Rating moyen - nécessite une sous-requête via les templates
        this.prisma.templateReview.aggregate({
          where: {
            templateId: {
              in: await this.prisma.marketplaceTemplate.findMany({
                where: { creatorId: profile.id },
                select: { id: true },
              }).then(templates => templates.map(t => t.id)),
            },
          },
          _avg: { rating: true },
        }),
      ]);

      // ✅ Mettre à jour le profil avec les stats calculées
      await this.prisma.creatorProfile.update({
        where: { userId: cleanUserId },
        data: {
          templatesCount,
          totalSales: salesData._count || 0,
          totalEarningsCents: salesData._sum.creatorRevenueCents || 0,
          followersCount,
          followingCount,
          averageRating: ratingsData._avg.rating || 0.0,
        },
      });

      // PERF-04: Invalider le cache après mise à jour
      await this.cache.invalidateTags([`creator:${cleanUserId}`]);

      this.logger.log(`Stats updated for creator profile ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update creator stats: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      // Ne pas throw pour ne pas bloquer les autres opérations
    }
  }

  /**
   * Vérifie un créateur (admin)
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRawUnsafe
   */
  async verifyCreator(userId: string, verified: boolean): Promise<CreatorProfile> {
    // ✅ Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    const cleanUserId = userId.trim();

    try {
      // ✅ Mettre à jour avec Prisma
      const profile = await this.prisma.creatorProfile.update({
        where: { userId: cleanUserId },
        data: {
          verified,
          verifiedAt: verified ? new Date() : null,
        },
      });

      this.logger.log(`Creator ${userId} ${verified ? 'verified' : 'unverified'}`);

      return profile as unknown as CreatorProfile;
    } catch (error) {
      this.logger.error(
        `Failed to verify creator: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
