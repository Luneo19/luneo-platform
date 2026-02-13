import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CreditsService } from '@/libs/credits/credits.service';
import { ENDPOINT_COSTS } from '@/libs/credits/costs';

/**
 * Middleware pour vérifier et déduire automatiquement les crédits
 * À utiliser sur les routes IA qui consomment des crédits
 */
@Injectable()
export class CreditsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CreditsMiddleware.name);

  constructor(private readonly creditsService: CreditsService) {}

  async use(
    req: Request & {
      user?: { id: string };
      creditsRequired?: number;
      creditsBalance?: number;
      creditsDeducted?: number;
      creditsNewBalance?: number;
    },
    res: Response,
    next: NextFunction,
  ) {
    const user = req.user;
    const endpoint = req.path;

    if (!user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Vérifier crédits
    const check = await this.creditsService.checkCredits(user.id, endpoint);

    if (!check.sufficient) {
      // Récupérer packs disponibles pour upsell
      const packs = await this.creditsService.getAvailablePacks();

      throw new HttpException(
        {
          message: 'Crédits insuffisants',
          code: 'INSUFFICIENT_CREDITS',
          balance: check.balance,
          required: check.required,
          missing: check.missing,
          upsell: {
            packs: packs.map((pack) => ({
              id: pack.id,
              name: pack.name,
              credits: pack.credits,
              price: pack.priceCents / 100,
              priceCents: pack.priceCents,
              stripePriceId: pack.stripePriceId,
              badge: pack.badge,
              savings: pack.savings,
            })),
          },
        },
        HttpStatus.PAYMENT_REQUIRED, // 402
      );
    }

    // Attacher info au request pour tracking
    req.creditsRequired = check.required;
    req.creditsBalance = check.balance;

    // Déduire crédits automatiquement AVANT d'autoriser la requête
    // CRITICAL: Si la déduction échoue, la requête DOIT être bloquée
    // pour éviter que l'utilisateur obtienne le service gratuitement
    try {
      const result = await this.creditsService.deductCredits(user.id, endpoint, {
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Attacher résultat au request
      req.creditsDeducted = result.cost;
      req.creditsNewBalance = result.newBalance;
    } catch (error) {
      this.logger.error('Failed to deduct credits - BLOCKING REQUEST', error instanceof Error ? error.stack : String(error), {
        userId: user.id,
        endpoint,
        method: req.method,
      });

      // CRITICAL FIX: Block the request if credit deduction fails
      // This prevents users from getting AI services for free
      throw new HttpException(
        {
          message: 'Erreur lors de la déduction des crédits. Veuillez réessayer.',
          code: 'CREDIT_DEDUCTION_FAILED',
          balance: check.balance,
          required: check.required,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    next();
  }
}













