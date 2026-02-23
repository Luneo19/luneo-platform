import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { QuotasService } from '@/modules/usage-billing/services/quotas.service';
import { UsageTrackingService } from '@/modules/usage-billing/services/usage-tracking.service';
import { Public } from '@/common/decorators/public.decorator';

/**
 * Enforces api_calls quota and records usage for Public API requests.
 * Must run after ApiKeyGuard so request.brandId is set.
 * Skips enforcement and tracking for @Public() endpoints (e.g. health).
 */
@Injectable()
export class ApiQuotaGuard implements CanActivate {
  private readonly logger = new Logger(ApiQuotaGuard.name);

  constructor(
    private readonly quotasService: QuotasService,
    private readonly usageTrackingService: UsageTrackingService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { brandId?: string }>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(Public, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic || !request.brandId) {
      return true;
    }
    await this.quotasService.enforceQuota(request.brandId, 'api_calls');
    const path = request.route?.path ?? request.url ?? request.path ?? '';
    const method = request.method ?? 'GET';
    await this.usageTrackingService.trackAPICall(request.brandId, path, method);
    return true;
  }
}
