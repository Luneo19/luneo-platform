import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import type { CurrentUser } from '../types/user.types';

/**
 * Optional JWT Auth Guard - validates JWT if present, but does not require it.
 * If a valid token is provided, user is attached to request.
 * If no token or invalid token, request continues without user (user stays undefined).
 * Use for endpoints that support both authenticated and anonymous access.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = CurrentUser>(
    err: Error | null,
    user: TUser | false,
  ): TUser | undefined {
    if (err || user === false) {
      return undefined;
    }
    return user as TUser;
  }

  private extractToken(request: { headers?: Record<string, string | string[] | undefined>; cookies?: Record<string, string> }): string | undefined {
    const auth = request.headers?.['authorization'];
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    return request.cookies?.['access_token'] ?? request.cookies?.['accessToken'];
  }
}
