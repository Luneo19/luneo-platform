import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { QuotasService } from '@/modules/usage-billing/services/quotas.service';
import { QUOTA_OPTIONS_METADATA_KEY, type QuotaOptions } from '../decorators/quota.decorator';

@Injectable()
export class QuotaGuard implements CanActivate {
  private readonly logger = new Logger(QuotaGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly quotasService: QuotasService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<QuotaOptions | undefined>(
      QUOTA_OPTIONS_METADATA_KEY,
      context.getHandler(),
    );

    if (!options) {
      // Aucun quota requis
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const brandId = this.resolveBrandId(request, options);

    if (!brandId) {
      throw new UnauthorizedException(
        'Unable to resolve brand identifier for quota enforcement',
      );
    }

    const amount = this.resolveAmount(request, options);
    const source = this.resolveSource(request);

    try {
      await this.quotasService.enforceQuota(brandId, options.metric, amount, { source });
      request.quotaCheck = {
        metric: options.metric,
        amount,
        brandId,
        checkedAt: new Date().toISOString(),
      };
      return true;
    } catch (error) {
      this.logger.warn(
        `Quota blocked for brand ${brandId} on metric ${options.metric}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ForbiddenException(
        error instanceof Error ? error.message : 'Quota exceeded',
      );
    }
  }

  private resolveBrandId(request: Request, options: QuotaOptions): string | undefined {
    if (options.brandField) {
      const resolved = this.getValueByPath(request, options.brandField);
      if (typeof resolved === 'string' && resolved.trim().length > 0) {
        return resolved;
      }
    }

    if (typeof request.brandId === 'string' && request.brandId.trim().length > 0) {
      return request.brandId;
    }

    const userBrand =
      typeof request.user === 'object' && request.user
        ? (request.user as Record<string, unknown>).brandId
        : undefined;

    if (typeof userBrand === 'string' && userBrand.trim().length > 0) {
      return userBrand;
    }

    return undefined;
  }

  private resolveAmount(request: Request, options: QuotaOptions): number {
    if (typeof options.amount === 'number') {
      return options.amount;
    }

    if (options.amountField) {
      const resolved = this.getValueByPath(request, options.amountField);
      const parsed = Number(resolved);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return 1;
  }

  private resolveSource(request: Request): 'internal_api' | 'public_api' | 'worker' | 'system' {
    if (request.apiKey) {
      return 'public_api';
    }
    if (request.headers['x-worker-signature']) {
      return 'worker';
    }
    return 'internal_api';
  }

  private getValueByPath(source: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, segment) => {
      if (acc && typeof acc === 'object' && segment in acc) {
        return (acc as Record<string, unknown>)[segment];
      }
      return undefined;
    }, source);
  }
}

