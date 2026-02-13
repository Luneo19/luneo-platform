import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    const payload = { sub: userId, email, role };

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
   * SEC-08: Sauvegarde du refresh token avec gestion de famille
   * 
   * @param userId - ID de l'utilisateur
   * @param token - Le refresh token JWT
   * @param family - Optionnel: famille de tokens pour rotation (nouvelle famille si non fourni)
   */
  async saveRefreshToken(userId: string, token: string, family?: string) {
    // AUTH FIX: Use configurable refresh token expiration instead of hardcoded 7 days
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const durationMs = this.parseDuration(refreshExpiresIn);
    const expiresAt = new Date(Date.now() + durationMs);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        // SEC-08: Si family fourni, utiliser la même famille (rotation)
        // Sinon, Prisma génère un nouveau cuid() (nouvelle session)
        ...(family && { family }),
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
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
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
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret,
      });

      // Check if token exists in database
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            include: {
              brand: true,
            },
          },
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // SEC-08: Détection de réutilisation de token
      // Si le token a déjà été utilisé, c'est une potentielle attaque
      if (tokenRecord.usedAt || tokenRecord.revokedAt) {
        this.logger.warn(
          `Refresh token reuse detected for user ${tokenRecord.userId}. ` +
          `Token family ${tokenRecord.family} will be invalidated. ` +
          `Potential token theft attempt.`
        );
        
        // Invalider toute la famille de tokens (sécurité)
        await this.prisma.refreshToken.updateMany({
          where: { family: tokenRecord.family },
          data: { revokedAt: new Date() },
        });
        
        throw new UnauthorizedException('Refresh token has been revoked. Please login again.');
      }

      // Vérifier expiration
      if (tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(
        tokenRecord.user.id,
        tokenRecord.user.email,
        tokenRecord.user.role,
      );

      // SEC-08: Marquer l'ancien token comme utilisé (pas supprimer, pour détecter réutilisation)
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });

      // Save new refresh token with same family
      await this.saveRefreshToken(
        tokenRecord.user.id, 
        tokens.refreshToken,
        tokenRecord.family, // Conserver la famille pour traçabilité
      );

      return {
        user: {
          id: tokenRecord.user.id,
          email: tokenRecord.user.email,
          firstName: tokenRecord.user.firstName,
          lastName: tokenRecord.user.lastName,
          role: tokenRecord.user.role,
          brandId: tokenRecord.user.brandId,
          brand: tokenRecord.user.brand,
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
   * Delete all refresh tokens for a user
   */
  async logout(userId: string) {
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
            usedAt: { 
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) 
            },
          },
        ],
      },
    });
    
    this.logger.log(`Cleaned up ${result.count} expired/revoked refresh tokens`);
    return result.count;
  }
}
