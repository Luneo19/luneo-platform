/**
 * @fileoverview Scheduler pour le nettoyage des refresh tokens
 * SEC-08: Nettoyage automatique des tokens expirés/révoqués
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth.service';

@Injectable()
export class TokenCleanupScheduler {
  private readonly logger = new Logger(TokenCleanupScheduler.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * SEC-08: Nettoie les tokens expirés et révoqués tous les jours à 3h du matin
   * - Tokens expirés (expiresAt < now)
   * - Tokens révoqués (revokedAt not null) - après détection de réutilisation
   * - Tokens utilisés depuis plus de 24h (usedAt > 24h)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    this.logger.log('Starting refresh token cleanup...');
    
    try {
      const cleanedCount = await this.authService.cleanupExpiredTokens();
      this.logger.log(`Token cleanup completed: ${cleanedCount} tokens removed`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens', error);
    }
  }
}
