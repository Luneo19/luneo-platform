import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard for setup-only endpoints (e.g. create-admin).
 * Requires X-Setup-Key header to match SETUP_SECRET_KEY env var.
 * Use with @Public() so JWT is not required; this guard enforces the secret.
 */
@Injectable()
export class SetupKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const setupKey = request.headers['x-setup-key'] as string | undefined;
    const validKey = this.configService.get<string>('SETUP_SECRET_KEY');

    if (!validKey) {
      throw new UnauthorizedException(
        'SETUP_SECRET_KEY environment variable is not configured',
      );
    }

    if (!setupKey || setupKey !== validKey) {
      throw new UnauthorizedException('Invalid setup key');
    }

    return true;
  }
}
