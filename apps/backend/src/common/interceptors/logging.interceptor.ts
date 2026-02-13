import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const userId = (request.user as { id?: string } | undefined)?.id ?? 'anonymous';
    const brandId =
      (request.user as { brandId?: string } | undefined)?.brandId ??
      (request as { brandId?: string }).brandId ??
      'none';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - now;
          this.logger.log(
            `${method} ${url} ${ms}ms`,
            JSON.stringify({ userId, brandId, duration: ms }),
          );
        },
        error: (err: Error) => {
          const ms = Date.now() - now;
          this.logger.error(
            `${method} ${url} ${ms}ms - ${err?.message ?? err}`,
            JSON.stringify({ userId, brandId, duration: ms, error: err?.message }),
          );
        },
      }),
    );
  }
}
