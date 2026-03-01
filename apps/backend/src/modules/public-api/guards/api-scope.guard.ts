import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_SCOPE_METADATA_KEY } from '../decorators/required-scope.decorator';
import { PublicApiAuthContext } from '../types/public-api-auth.type';

interface PublicApiRequest {
  publicApiAuth?: PublicApiAuthContext;
}

@Injectable()
export class ApiScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScope = this.reflector.getAllAndOverride<string>(
      REQUIRED_SCOPE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredScope) return true;

    const request = context.switchToHttp().getRequest<PublicApiRequest>();
    const scopes = request.publicApiAuth?.scopes ?? [];
    const isAllowed =
      scopes.includes('*') ||
      scopes.includes(requiredScope) ||
      scopes.includes(`${requiredScope.split(':')[0]}:*`);

    if (!isAllowed) {
      throw new ForbiddenException(`Missing required scope: ${requiredScope}`);
    }
    return true;
  }
}
