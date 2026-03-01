import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSION_METADATA_KEY } from '../decorators/required-permission.decorator';
import { PublicApiAuthContext } from '../types/public-api-auth.type';

interface PublicApiRequest {
  publicApiAuth?: PublicApiAuthContext;
}

@Injectable()
export class ApiPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest<PublicApiRequest>();
    const permissions = request.publicApiAuth?.permissions ?? [];
    const namespace = requiredPermission.split(':')[0];
    const isAllowed =
      permissions.includes('*') ||
      permissions.includes(requiredPermission) ||
      permissions.includes(`${namespace}:*`);

    if (!isAllowed) {
      throw new ForbiddenException(
        `Missing required permission: ${requiredPermission}`,
      );
    }
    return true;
  }
}
