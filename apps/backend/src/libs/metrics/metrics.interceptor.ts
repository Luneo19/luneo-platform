import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PrometheusService } from './prometheus.service';

/**
 * Interceptor pour capturer automatiquement les métriques HTTP
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly prometheus: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract route (remove query params)
    const route = request.route?.path || request.path;
    const method = request.method;
    const brandId = (request.user as any)?.brandId || 'unknown';

    // Track request size
    const requestSize = this.getRequestSize(request);
    if (requestSize > 0) {
      this.prometheus.httpRequestSize.observe({ method, route }, requestSize);
    }

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - startTime) / 1000;
        const status = String(response.statusCode);
        const responseSize = this.getResponseSize(response);

        // Increment request counter
        this.prometheus.httpRequestsTotal.inc({
          method,
          route,
          status,
          brandId,
        });

        // Record duration
        this.prometheus.httpRequestDuration.observe({ method, route, status }, duration);

        // Record response size
        if (responseSize > 0) {
          this.prometheus.httpResponseSize.observe({ method, route, status }, responseSize);
        }
      }),
      catchError((error) => {
        const duration = (Date.now() - startTime) / 1000;
        const status = String(error.status || 500);

        // Increment error counter
        this.prometheus.httpRequestsTotal.inc({
          method,
          route,
          status,
          brandId,
        });

        // Record error duration
        this.prometheus.httpRequestDuration.observe({ method, route, status }, duration);

        throw error;
      }),
    );
  }

  private getRequestSize(request: Request): number {
    if (request.headers['content-length']) {
      return parseInt(request.headers['content-length'], 10);
    }
    if (request.body) {
      return JSON.stringify(request.body).length;
    }
    return 0;
  }

  private getResponseSize(response: Response): number {
    const contentLength = response.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    return 0;
  }
}




















