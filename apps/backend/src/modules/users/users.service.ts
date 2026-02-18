import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { hashPassword, verifyPassword } from '@/libs/crypto/password-hasher';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { TokenBlacklistService } from '@/libs/auth/token-blacklist.service';

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
    // SECURITY FIX: Token blacklist for immediate revocation on password change
    private tokenBlacklist: TokenBlacklistService,
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

    // SECURITY FIX: Use verifyPassword (supports both bcrypt and Argon2id)
    const { isValid: isPasswordValid } = await verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // SECURITY FIX: Use Argon2id instead of bcrypt for new password hash
    const hashedPassword = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // SECURITY FIX: Blacklist access tokens immediately + invalidate all refresh tokens
    await this.tokenBlacklist.blacklistUser(userId);
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  async getSessions(userId: string) {
    // Utiliser RefreshToken comme sessions
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        revokedAt: null,
        usedAt: null, // Only show active (unused) tokens as sessions
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        // SECURITY FIX: Include real session metadata
        ipAddress: true,
        userAgent: true,
        deviceInfo: true,
      },
    });

    return {
      sessions: tokens.map((token, index) => ({
        id: token.id,
        // SECURITY FIX: Return real metadata instead of 'Unknown'
        device: token.deviceInfo || this.parseDevice(token.userAgent),
        browser: this.parseBrowser(token.userAgent),
        ip: token.ipAddress ? this.maskIp(token.ipAddress) : 'Unknown',
        current: index === 0,
        lastActive: token.createdAt,
        createdAt: token.createdAt,
      })),
    };
  }

  /** Parse browser from user-agent string */
  private parseBrowser(userAgent: string | null): string {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    return 'Other';
  }

  /** Parse device from user-agent string */
  private parseDevice(userAgent: string | null): string {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) return 'Mobile';
    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'Tablet';
    return 'Desktop';
  }

  /** Mask IP address for privacy (show only first two octets) */
  private maskIp(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
    // IPv6 or other format - show first half
    if (ip.includes(':')) {
      const v6parts = ip.split(':');
      return v6parts.slice(0, 3).join(':') + ':***';
    }
    return ip;
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

  // SECURITY FIX: Allowed MIME types and magic bytes for image upload validation
  private static readonly ALLOWED_IMAGE_TYPES: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
    'image/svg+xml': [], // SVG is text-based, checked differently
  };

  /** Validate file magic bytes match declared MIME type */
  private validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
    const signatures = UsersService.ALLOWED_IMAGE_TYPES[mimetype];
    if (!signatures || signatures.length === 0) {
      // For SVG, check for XML-like content
      if (mimetype === 'image/svg+xml') {
        const header = buffer.subarray(0, 500).toString('utf8').toLowerCase();
        return header.includes('<svg') && !header.includes('<script');
      }
      return false;
    }
    return signatures.some(sig =>
      sig.every((byte, i) => buffer[i] === byte)
    );
  }

  async uploadAvatar(userId: string, file: { buffer: Buffer; mimetype: string; size: number }) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // SECURITY FIX: Strict whitelist of allowed image MIME types
    const allowedTypes = Object.keys(UsersService.ALLOWED_IMAGE_TYPES);
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new BadRequestException('Image size must not exceed 2MB');
    }

    // SECURITY FIX: Validate magic bytes match declared MIME type (prevent MIME spoofing)
    if (!this.validateMagicBytes(file.buffer, file.mimetype)) {
      this.logger.warn(`Magic bytes mismatch for upload by user ${userId}: declared ${file.mimetype}`);
      throw new BadRequestException('File content does not match declared type');
    }

    // SECURITY FIX: Reject SVG to prevent XSS via SVG (SVG can contain JavaScript)
    if (file.mimetype === 'image/svg+xml') {
      throw new BadRequestException('SVG uploads are not allowed for security reasons');
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
