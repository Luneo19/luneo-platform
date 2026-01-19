import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

/**
 * Service de protection contre les attaques brute force
 * Utilise Redis pour tracker les tentatives d'authentification
 */
@Injectable()
export class BruteForceService {
  private readonly logger = new Logger(BruteForceService.name);

  constructor(private readonly redisService: RedisOptimizedService) {}

  /**
   * Génère une clé unique pour identifier une tentative
   */
  private getIdentifier(email: string, ip: string): string {
    return `brute-force:${email}:${ip}`;
  }

  /**
   * Vérifie si l'utilisateur peut faire une tentative
   */
  async canAttempt(email: string, ip: string): Promise<boolean> {
    try {
      const identifier = this.getIdentifier(email, ip);
      const redis = this.redisService.client;

      if (!redis) {
        // Si Redis n'est pas disponible, autoriser (mode dégradé)
        return true;
      }

      // Gérer spécifiquement les erreurs de limite Upstash Redis avec timeout
      let attempts: string | null = null;
      try {
        // Timeout de 2 secondes pour éviter de bloquer le login
        attempts = await Promise.race([
          redis.get(identifier),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Redis timeout')), 2000)
          ),
        ]) as string | null;
      } catch (redisError: any) {
        if (redisError?.message?.includes('max requests limit exceeded') || 
            redisError?.message?.includes('Redis timeout') ||
            redisError?.message?.includes('timeout')) {
          this.logger.warn('Redis limit exceeded or timeout in brute force check, allowing request');
          return true; // Fail open - allow request
        }
        // Pour les autres erreurs, autoriser aussi (ne pas bloquer les utilisateurs)
        this.logger.warn('Redis error in brute force check, allowing request', redisError?.message);
        return true;
      }

      const attemptCount = attempts ? parseInt(attempts, 10) : 0;

      // Limite : 5 tentatives avant blocage
      if (attemptCount >= 5) {
        let ttl = 0;
        try {
          // Timeout de 1 seconde pour TTL
          ttl = await Promise.race([
            redis.ttl(identifier),
            new Promise<number>((resolve) => setTimeout(() => resolve(0), 1000)),
          ]) as number;
        } catch (ttlError: any) {
          // Ignore TTL errors (non-critical)
          this.logger.debug('Error getting TTL (non-critical)', ttlError?.message);
        }
        this.logger.warn('Brute force detected', {
          email,
          ip,
          attempts: attemptCount,
          ttl,
        });
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error checking brute force', error);
      // En cas d'erreur, autoriser (ne pas bloquer les utilisateurs légitimes)
      return true;
    }
  }

  /**
   * Enregistre une tentative échouée
   */
  async recordFailedAttempt(email: string, ip: string): Promise<void> {
    try {
      const identifier = this.getIdentifier(email, ip);
      const redis = this.redisService.client;

      if (!redis) {
        return;
      }

      try {
        const attempts = await redis.incr(identifier);

        // Si c'est la première tentative, définir expiration (15 minutes)
        if (attempts === 1) {
          try {
            await redis.expire(identifier, 900); // 15 minutes
          } catch (expireError: any) {
            // Ignore expire errors if Redis limit exceeded
            if (!expireError?.message?.includes('max requests limit exceeded')) {
              throw expireError;
            }
          }
        }

        this.logger.debug('Failed attempt recorded', {
          email,
          ip,
          attempts,
        });
      } catch (redisError: any) {
        if (redisError?.message?.includes('max requests limit exceeded')) {
          this.logger.warn('Redis limit exceeded, skipping brute force tracking');
          return; // Fail silently - don't block login
        }
        throw redisError; // Re-throw other errors
      }
    } catch (error) {
      this.logger.error('Error recording failed attempt', error);
      // Don't throw - allow login to continue
    }
  }

  /**
   * Réinitialise les tentatives après une connexion réussie
   */
  async resetAttempts(email: string, ip: string): Promise<void> {
    try {
      const identifier = this.getIdentifier(email, ip);
      const redis = this.redisService.client;

      if (!redis) {
        return;
      }

      try {
        await redis.del(identifier);
        this.logger.debug('Brute force attempts reset', { email, ip });
      } catch (redisError: any) {
        if (redisError?.message?.includes('max requests limit exceeded')) {
          this.logger.warn('Redis limit exceeded, skipping brute force reset');
          return; // Fail silently - don't block login
        }
        throw redisError; // Re-throw other errors
      }
    } catch (error) {
      this.logger.error('Error resetting attempts', error);
      // Don't throw - allow login to continue
    }
  }

  /**
   * Obtient le temps restant avant déblocage (en secondes)
   */
  async getRemainingTime(email: string, ip: string): Promise<number> {
    try {
      const identifier = this.getIdentifier(email, ip);
      const redis = this.redisService.client;

      if (!redis) {
        return 0;
      }

      const ttl = await redis.ttl(identifier);
      return Math.max(0, ttl);
    } catch (error) {
      this.logger.error('Error getting remaining time', error);
      return 0;
    }
  }

  /**
   * Vérifie et lance une exception si trop de tentatives
   */
  async checkAndThrow(email: string, ip: string): Promise<void> {
    const canAttempt = await this.canAttempt(email, ip);

    if (!canAttempt) {
      const remainingTime = await this.getRemainingTime(email, ip);
      const minutes = Math.ceil(remainingTime / 60);

      throw new HttpException(
        `Trop de tentatives de connexion. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
