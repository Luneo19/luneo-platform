import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { HttpMetricsService } from './http-metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly httpMetricsService: HttpMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const method = request.method;
    const route =
      request.route?.path ?? request.baseUrl ?? request.originalUrl ?? request.url ?? 'unknown';
    const brandId = (request as Request & { brandId?: string }).brandId ?? request.user?.brandId ?? 'public';

    const startTime = process.hrtime.bigint();

    const recordSuccess = (): void => {
      const durationMs = this.computeDurationMs(startTime);
      this.httpMetricsService.recordSuccess(method, route, response.statusCode, durationMs, brandId);
    };

    const recordError = (error: unknown): void => {
      const durationMs = this.computeDurationMs(startTime);
      const statusCode = this.resolveStatusCode(error);
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      this.httpMetricsService.recordError(method, route, statusCode, durationMs, errorName, brandId);
    };

    return next.handle().pipe(
      tap({
        next: recordSuccess,
        complete: recordSuccess,
      }),
      catchError((error) => {
        recordError(error);
        return throwError(() => error);
      }),
    );
  }

  private computeDurationMs(startTime: bigint): number {
    const diff = process.hrtime.bigint() - startTime;
    return Number(diff) / 1_000_000;
  }

  private resolveStatusCode(error: unknown): number {
    if (typeof error === 'object' && error !== null) {
      const maybeWithStatus = error as { status?: number; statusCode?: number };
      if (typeof maybeWithStatus.status === 'number') {
        return maybeWithStatus.status;
      }
      if (typeof maybeWithStatus.statusCode === 'number') {
        return maybeWithStatus.statusCode;
      }
    }
    return 500;
  }
}


