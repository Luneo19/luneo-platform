import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TokenBlacklistService } from '@/libs/auth/token-blacklist.service';
import { UserRole } from '@/common/compat/v1-enums';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

  /**
   * Parse a duration string (e.g. '7d', '24h', '30m') to milliseconds.
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      // Default to 7 days if format is unrecognized
      return 7 * 24 * 60 * 60 * 1000;
    }
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role, jti: randomUUID() };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * SEC-08: Sauvegarde du refresh token avec gestion de famille et metadata
   * 
   * @param userId - ID de l'utilisateur
   * @param token - Le refresh token JWT
   * @param family - Optionnel: famille de tokens pour rotation (nouvelle famille si non fourni)
   * @param metadata - Optionnel: IP, user-agent pour traçabilite session
   */
  /** Maximum number of concurrent active sessions per user */
  private readonly MAX_SESSIONS_PER_USER = 10;

  async saveRefreshToken(
    userId: string,
    token: string,
    family?: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    // AUTH FIX: Use configurable refresh token expiration instead of hardcoded 7 days
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const durationMs = this.parseDuration(refreshExpiresIn);
    const expiresAt = new Date(Date.now() + durationMs);

    // SECURITY FIX: Enforce maximum concurrent sessions per user
    // Only count active tokens (not used, not revoked, not expired) for session count
    if (!family) {
      // This is a new session (not a rotation) - check session limit
      const activeSessions = await this.prisma.refreshToken.count({
        where: {
          userId,
          isRevoked: false,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (activeSessions >= this.MAX_SESSIONS_PER_USER) {
        // Revoke the oldest session to make room
        const oldestSession = await this.prisma.refreshToken.findFirst({
          where: {
            userId,
            isRevoked: false,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'asc' },
        });
        if (oldestSession) {
          await this.prisma.refreshToken.update({
            where: { id: oldestSession.id },
            data: { revokedAt: new Date() },
          });
          this.logger.warn(
            `Max sessions (${this.MAX_SESSIONS_PER_USER}) reached for user ${userId}. Oldest session revoked.`
          );
        }
      }
    }

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        ...(family && { deviceId: family }),
        ...(metadata?.ipAddress && { deviceId: metadata.ipAddress }),
        ...(metadata?.userAgent && { deviceName: metadata.userAgent.substring(0, 200) }),
      },
    });

  }

  /**
   * SEC-08: Rotation des refresh tokens avec détection de réutilisation
   * 
   * Implémente le pattern "Refresh Token Rotation" recommandé par l'OWASP:
   * - Chaque refresh token ne peut être utilisé qu'une seule fois
   * - Un nouveau token est généré à chaque utilisation
   * - Si un token déjà utilisé est réutilisé, toute la famille est invalidée
   *   (indique potentiellement un vol de token)
   * - SECURITY FIX: IP/User-Agent binding to detect token theft across different clients
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    const { refreshToken } = refreshTokenDto;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // Verify refresh token JWT signature
      const secret = this.configService.get<string>('jwt.refreshSecret');
      if (!secret) {
        throw new UnauthorizedException('Refresh token configuration missing');
      }
      const _payload = await this.jwtService.verifyAsync(refreshToken, {
        secret,
      });

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (tokenRecord.isRevoked || tokenRecord.revokedAt) {
        this.logger.warn(
          `Refresh token reuse detected for user ${tokenRecord.userId}. ` +
          `Token device ${tokenRecord.deviceId} will be invalidated. ` +
          `Potential token theft attempt.`
        );
        
        await this.prisma.refreshToken.updateMany({
          where: { userId: tokenRecord.userId, deviceId: tokenRecord.deviceId },
          data: { revokedAt: new Date() },
        });
        
        throw new UnauthorizedException('Refresh token has been revoked. Please login again.');
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      const tokenUser = await this.prisma.user.findUnique({
        where: { id: tokenRecord.userId },
        include: {
          memberships: { where: { isActive: true }, include: { organization: true }, take: 1 },
        },
      });

      if (!tokenUser) {
        throw new UnauthorizedException('User not found');
      }

      if (tokenUser.deletedAt !== null) {
        this.logger.warn(`Token refresh denied for inactive user ${tokenRecord.userId}`);
        throw new UnauthorizedException('User account is inactive');
      }

      if (metadata?.ipAddress && tokenRecord.deviceId && metadata.ipAddress !== tokenRecord.deviceId) {
        this.logger.warn(
          `Refresh token device mismatch for user ${tokenRecord.userId}: ` +
          `original=${tokenRecord.deviceId}, current=${metadata.ipAddress}. `
        );
      }

      const tokens = await this.generateTokens(
        tokenUser.id,
        tokenUser.email,
        tokenUser.role,
      );

      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      await this.saveRefreshToken(
        tokenUser.id, 
        tokens.refreshToken,
        tokenRecord.deviceId ?? undefined,
        metadata,
      );

      return {
        user: {
          id: tokenUser.id,
          email: tokenUser.email,
          firstName: tokenUser.firstName,
          lastName: tokenUser.lastName,
          role: tokenUser.role,
          organizationId: tokenUser.memberships?.[0]?.organizationId ?? null,
          organization: tokenUser.memberships?.[0]?.organization ?? null,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Delete all refresh tokens for a user and blacklist active access tokens
   */
  async logout(userId: string) {
    // SECURITY FIX: Blacklist access tokens in Redis so they're immediately rejected
    // This closes the 15-minute window where revoked tokens could still be used
    await this.tokenBlacklist.blacklistUser(userId);

    // Delete all refresh tokens for user
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * SEC-08: Nettoie les tokens expirés et révoqués (à appeler périodiquement)
   * Cette méthode peut être appelée par un cron job ou un scheduler
   */
  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
          // Supprimer aussi les tokens utilisés de plus de 24h
          // (garde une fenêtre pour détecter les réutilisations récentes)
          {
            isRevoked: true,
          },
        ],
      },
    });
    
    this.logger.log(`Cleaned up ${result.count} expired/revoked refresh tokens`);
    return result.count;
  }
}
