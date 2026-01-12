/**
 * OAuth Guard
 * Protects OAuth callback routes
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OAuthGuard extends AuthGuard(['google', 'github']) {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const provider = request.params?.provider || request.query?.provider;

    // Set the strategy based on provider
    if (provider === 'google') {
      return super.canActivate(context) as Promise<boolean>;
    }
    if (provider === 'github') {
      return super.canActivate(context) as Promise<boolean>;
    }

    // Default: try both strategies
    return super.canActivate(context) as Promise<boolean>;
  }
}
