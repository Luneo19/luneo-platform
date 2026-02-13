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
      } catch (redisError: unknown) {
        const msg = redisError instanceof Error ? redisError.message : String(redisError ?? '');
        if (msg.includes('max requests limit exceeded') || msg.includes('Redis timeout') || msg.includes('timeout')) {
          this.logger.warn('Redis limit exceeded or timeout in brute force check, allowing request');
          return true; // Fail open - allow request
        }
        this.logger.warn('Redis error in brute force check, allowing request', msg);
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
        } catch (ttlError: unknown) {
          const ttlMsg = ttlError instanceof Error ? ttlError.message : String(ttlError);
          this.logger.debug('Error getting TTL (non-critical)', ttlMsg);
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
        // Timeout de 2 secondes pour éviter de bloquer
        const attempts = await Promise.race([
          redis.incr(identifier),
          new Promise<number>((resolve) => setTimeout(() => resolve(0), 2000)),
        ]) as number;

        // Si c'est la première tentative, définir expiration (15 minutes)
        if (attempts === 1) {
          try {
            await Promise.race([
              redis.expire(identifier, 900), // 15 minutes
              new Promise<void>((resolve) => setTimeout(() => resolve(), 1000)),
            ]);
          } catch (expireError: unknown) {
            const expMsg = expireError instanceof Error ? expireError.message : String(expireError);
            this.logger.debug('Error setting expire (non-critical)', expMsg);
          }
        }

        this.logger.debug('Failed attempt recorded', {
          email,
          ip,
          attempts,
        });
      } catch (redisError: unknown) {
        const msg = redisError instanceof Error ? redisError.message : String(redisError ?? '');
        if (msg.includes('max requests limit exceeded') || msg.includes('timeout')) {
          this.logger.warn('Redis limit exceeded or timeout, skipping brute force tracking');
          return;
        }
        this.logger.warn('Redis error in recordFailedAttempt, skipping', msg);
        return;
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
        // Timeout de 1 seconde pour éviter de bloquer
        await Promise.race([
          redis.del(identifier),
          new Promise<void>((resolve) => setTimeout(() => resolve(), 1000)),
        ]);
        this.logger.debug('Brute force attempts reset', { email, ip });
      } catch (redisError: unknown) {
        const msg = redisError instanceof Error ? redisError.message : String(redisError ?? '');
        if (msg.includes('max requests limit exceeded') || msg.includes('timeout')) {
          this.logger.warn('Redis limit exceeded or timeout, skipping brute force reset');
          return;
        }
        this.logger.warn('Redis error in resetAttempts, skipping', msg);
        return;
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

      // Timeout de 1 seconde pour éviter de bloquer
      try {
        const ttl = await Promise.race([
          redis.ttl(identifier),
          new Promise<number>((resolve) => setTimeout(() => resolve(0), 1000)),
        ]) as number;
        return Math.max(0, ttl);
      } catch (ttlError: unknown) {
        const ttlMsg = ttlError instanceof Error ? ttlError.message : String(ttlError);
        this.logger.debug('Error getting remaining time (non-critical)', ttlMsg);
        return 0;
      }
    } catch (error) {
      this.logger.error('Error getting remaining time', error);
      return 0;
    }
  }

  /**
   * Vérifie et lance une exception si trop de tentatives
   * Avec timeout global pour éviter de bloquer le login
   */
  async checkAndThrow(email: string, ip: string): Promise<void> {
    try {
      // Timeout global de 3 secondes pour toute la vérification brute-force
      const canAttempt = await Promise.race([
        this.canAttempt(email, ip),
        new Promise<boolean>((resolve) => setTimeout(() => {
          this.logger.debug('Brute force check timeout, allowing request');
          resolve(true); // Fail open - allow request
        }, 3000)),
      ]);

      if (!canAttempt) {
        const remainingTime = await Promise.race([
          this.getRemainingTime(email, ip),
          new Promise<number>((resolve) => setTimeout(() => resolve(0), 1000)),
        ]);

        const minutes = Math.ceil(remainingTime / 60);

        throw new HttpException(
          `Trop de tentatives de connexion. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      // Si c'est une HttpException (trop de tentatives), la relancer
      if (error instanceof HttpException) {
        throw error;
      }
      // Pour toute autre erreur (timeout, Redis, etc.), autoriser (fail open)
      this.logger.warn('Brute force check error, allowing request', error?.message || error);
      return; // Allow login to continue
    }
  }
}
