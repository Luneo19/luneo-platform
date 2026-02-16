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

const RATE_LIMITS_BY_PLAN: Record<
  string,
  { perHour: number; perDay: number }
> = {
  FREE: { perHour: 20, perDay: 50 },
  STARTER: { perHour: 50, perDay: 200 },
  PRO: { perHour: 100, perDay: 500 },
  BUSINESS: { perHour: 500, perDay: 2000 },
  ENTERPRISE: { perHour: 2000, perDay: 10000 },
};

@Injectable()
export class AIRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AIRateLimitGuard.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true; // Skip if no auth (handled by auth guard)

    const plan = user.plan || 'FREE';
    const limits = RATE_LIMITS_BY_PLAN[plan] || RATE_LIMITS_BY_PLAN.FREE;

    // Check hourly rate
    const hourKey = `ai:ratelimit:${user.id}:hour:${new Date().toISOString().slice(0, 13)}`;
    const hourCount = ((await this.cacheManager.get<number>(hourKey)) || 0) + 1;

    if (hourCount > limits.perHour) {
      this.logger.warn(
        `Rate limit exceeded for user ${user.id}: ${hourCount}/${limits.perHour} per hour`,
      );
      throw new HttpException(
        {
          message: `Rate limit exceeded. Maximum ${limits.perHour} generations per hour for ${plan} plan.`,
          retryAfter: 3600,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check daily rate
    const dayKey = `ai:ratelimit:${user.id}:day:${new Date().toISOString().slice(0, 10)}`;
    const dayCount = ((await this.cacheManager.get<number>(dayKey)) || 0) + 1;

    if (dayCount > limits.perDay) {
      this.logger.warn(
        `Daily rate limit exceeded for user ${user.id}: ${dayCount}/${limits.perDay} per day`,
      );
      throw new HttpException(
        {
          message: `Daily rate limit exceeded. Maximum ${limits.perDay} generations per day for ${plan} plan.`,
          retryAfter: 86400,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counters
    await this.cacheManager.set(hourKey, hourCount, 3600000);
    await this.cacheManager.set(dayKey, dayCount, 86400000);

    return true;
  }
}
