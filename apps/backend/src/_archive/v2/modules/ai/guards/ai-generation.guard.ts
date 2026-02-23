import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreditsService } from '@/libs/credits/credits.service';

@Injectable()
export class AIGenerationGuard implements CanActivate {
  private readonly logger = new Logger(AIGenerationGuard.name);

  constructor(
    private readonly creditsService: CreditsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true;

    // 1. Check credits
    const creditsCheck = await this.creditsService.checkCredits(
      user.id,
      request.path,
      1,
    );
    if (!creditsCheck.sufficient) {
      throw new HttpException(
        {
          message: `Insufficient credits. Balance: ${creditsCheck.balance}`,
          code: 'INSUFFICIENT_CREDITS',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // 2. Check rate limit (delegate to AIRateLimitGuard logic inline)
    const plan = user.plan || 'FREE';
    const limits: Record<string, number> = {
      FREE: 20,
      STARTER: 50,
      PRO: 100,
      BUSINESS: 500,
      ENTERPRISE: 2000,
    };
    const hourKey = `ai:ratelimit:${user.id}:hour:${new Date().toISOString().slice(0, 13)}`;
    const hourCount = (await this.cacheManager.get<number>(hourKey)) || 0;

    if (hourCount >= (limits[plan] || 20)) {
      throw new HttpException(
        {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
