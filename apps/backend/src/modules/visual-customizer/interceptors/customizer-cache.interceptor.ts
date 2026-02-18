import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { IS_CUSTOMIZER_PUBLIC_KEY } from '../decorators/customizer-permissions.decorator';

@Injectable()
export class CustomizerCacheInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    // Check if route is marked as customizer public
    const isCustomizerPublic = this.reflector.getAllAndOverride<boolean>(
      IS_CUSTOMIZER_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      tap(() => {
        // Set cache headers based on route type
        if (isCustomizerPublic) {
          // Public routes: cache for 5 minutes
          response.setHeader('Cache-Control', 'public, max-age=300');
        } else {
          // Authenticated routes: cache for 1 minute
          response.setHeader('Cache-Control', 'private, max-age=60');
        }
      }),
    );
  }
}
