import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class InternalTokenGuard implements CanActivate {
  private readonly token =
    process.env.INTERNAL_API_TOKEN || process.env.LUNEO_INTERNAL_API_TOKEN || '';

  canActivate(context: ExecutionContext): boolean {
    if (!this.token) {
      throw new UnauthorizedException('Internal API token is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedToken = this.extractToken(request);

    if (!providedToken) {
      throw new UnauthorizedException('Internal API token is required');
    }

    if (providedToken !== this.token) {
      throw new UnauthorizedException('Invalid internal API token');
    }

    return true;
  }

  private extractToken(request: Request): string | null {
    const headerToken = request.headers['x-internal-token'];
    if (typeof headerToken === 'string') {
      return headerToken.trim();
    }

    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    return null;
  }
}


