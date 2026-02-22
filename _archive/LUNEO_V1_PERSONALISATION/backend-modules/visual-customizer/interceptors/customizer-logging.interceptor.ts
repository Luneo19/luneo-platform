import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { CurrentUser } from '@/common/types/user.types';

@Injectable()
export class CustomizerLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CustomizerLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const { method, url } = request;
    const user = request.user;
    const userId = user?.id || 'anonymous';
    const brandId = user?.brandId || 'none';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} - User: ${userId}, Brand: ${brandId}, Duration: ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} - User: ${userId}, Brand: ${brandId}, Duration: ${duration}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
