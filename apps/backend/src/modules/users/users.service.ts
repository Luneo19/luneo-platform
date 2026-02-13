import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcryptjs';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';

/**
 * CACHE-01: Service utilisateurs avec cache Redis
 * - Profil utilisateur: TTL 5 minutes (300s)
 * - Quota utilisateur: TTL 1 minute (60s) 
 * - Sessions: pas de cache (données sensibles)
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private cache: SmartCacheService,
  ) {}

  /**
   * CACHE-01: Récupère un utilisateur avec cache Redis (TTL 5min)
   */
  async findOne(id: string, currentUser: CurrentUser) {
    // Check permissions first (before cache lookup)
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Access denied');
    }

    const user = await this.cache.get(
      id,
      'user',
      async () => {
        return this.prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            brandId: true,
            createdAt: true,
            updatedAt: true,
            brand: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            userQuota: {
              select: {
                id: true,
                monthlyLimit: true,
                monthlyUsed: true,
                costLimitCents: true,
                costUsedCents: true,
                resetAt: true,
              },
            },
            userProfile: {
              select: {
                phone: true,
                website: true,
                timezone: true,
              },
            },
          },
        });
      },
      { ttl: 300, tags: [`user:${id}`] } // 5 minutes
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * CACHE-01: Met à jour le profil et invalide le cache
   */
  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    const { firstName, lastName, avatar, phone, website, timezone } = updateData;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          avatar,
        },
      });
      const profilePayload =
        phone !== undefined || website !== undefined || timezone !== undefined
          ? { phone: phone ?? undefined, website: website ?? undefined, timezone: timezone ?? undefined }
          : undefined;
      if (profilePayload) {
        await tx.userProfile.upsert({
          where: { userId },
          create: { userId, ...profilePayload },
          update: profilePayload,
        });
      }
    });

    // CACHE-01: Invalider le cache utilisateur après modification
    await this.cache.invalidate(userId, 'user');
    this.logger.debug(`Cache invalidated for user:${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        brandId: true,
        createdAt: true,
        updatedAt: true,
        brand: { select: { id: true, name: true, logo: true } },
        userQuota: {
          select: {
            id: true,
            monthlyLimit: true,
            monthlyUsed: true,
            costLimitCents: true,
            costUsedCents: true,
            resetAt: true,
          },
        },
        userProfile: {
          select: { phone: true, website: true, timezone: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * CACHE-01: Récupère le quota utilisateur avec cache Redis (TTL 1min)
   * TTL court car les quotas changent fréquemment
   */
  async getUserQuota(userId: string) {
    const quota = await this.cache.get(
      `quota:${userId}`,
      'user',
      async () => {
        return this.prisma.userQuota.findUnique({
          where: { userId },
        });
      },
      { ttl: 60, tags: [`user:${userId}`, `quota:${userId}`] } // 1 minute
    );

    if (!quota) {
      throw new NotFoundException('User quota not found');
    }

    return quota;
  }

  async resetUserQuota(userId: string) {
    return this.prisma.userQuota.update({
      where: { userId },
      data: {
        monthlyUsed: 0,
        costUsedCents: 0,
        resetAt: new Date(),
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 13);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  async getSessions(userId: string) {
    // Utiliser RefreshToken comme sessions
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return {
      sessions: tokens.map((token, index) => ({
        id: token.id,
        device: 'Unknown',
        browser: 'Unknown',
        location: 'Unknown',
        ip: 'Unknown',
        current: index === 0,
        lastActive: token.createdAt,
        createdAt: token.createdAt,
      })),
    };
  }

  async deleteSession(userId: string, sessionId: string) {
    const token = await this.prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });

    if (!token || token.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.refreshToken.delete({
      where: { id: sessionId },
    });

    return { success: true, message: 'Session deleted successfully' };
  }

  async deleteAllSessions(userId: string, currentTokenId?: string) {
    const where: { userId: string; NOT?: { id: string } } = { userId };
    if (currentTokenId) {
      where.NOT = { id: currentTokenId };
    }

    await this.prisma.refreshToken.deleteMany({ where });

    return { success: true, message: 'All sessions deleted successfully' };
  }

  async uploadAvatar(userId: string, file: { buffer: Buffer; mimetype: string; size: number }) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new BadRequestException('Image size must not exceed 2MB');
    }

    const avatarUrl = await this.cloudinaryService.uploadImage(file.buffer, 'avatars');

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    return { avatar: avatarUrl };
  }

  async deleteAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (user?.avatar) {
      // Extraire le public_id de l'URL Cloudinary si possible
      // Pour l'instant, on supprime juste l'URL du profil
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatar: null },
      });
    }

    return { success: true, message: 'Avatar deleted successfully' };
  }
}
