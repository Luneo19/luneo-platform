import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Skip safe methods (GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Skip routes decorated with @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // For POST/PUT/PATCH/DELETE, check CSRF token
    const csrfTokenHeader = request.headers['x-csrf-token'] as string;
    const csrfTokenCookie = request.cookies?.csrf_token;

    if (!csrfTokenHeader || !csrfTokenCookie) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    if (csrfTokenHeader !== csrfTokenCookie) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
