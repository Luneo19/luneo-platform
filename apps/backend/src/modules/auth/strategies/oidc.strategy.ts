import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OidcPassportStrategy = require('passport-openidconnect');
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * OpenID Connect (OIDC) Strategy for Enterprise SSO
 * Supports OIDC authentication protocol (used by Azure AD, Okta, etc.)
 * 
 * Configuration required:
 * - OIDC_ISSUER: OIDC issuer URL (e.g., https://login.microsoftonline.com/{tenant-id}/v2.0)
 * - OIDC_CLIENT_ID: OIDC client ID
 * - OIDC_CLIENT_SECRET: OIDC client secret
 * - OIDC_CALLBACK_URL: Callback URL for OIDC responses
 * - OIDC_SCOPE: OIDC scopes (default: 'openid profile email')
 * 
 * NOTE: This strategy is disabled until passport-openidconnect is installed
 */
@Injectable()
export class OidcStrategy extends PassportStrategy(OidcPassportStrategy, 'oidc') {
  private readonly logger = new Logger(OidcStrategy.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const issuer = configService.get<string>('OIDC_ISSUER') || configService.get<string>('oidc.issuer');
    if (!issuer) {
      throw new Error('OIDC_ISSUER is required for OIDC strategy. Please configure it or disable OIDC.');
    }
    
    super({
      issuer,
      authorizationURL: configService.get<string>('OIDC_AUTHORIZATION_URL') || configService.get<string>('oidc.authorizationURL'),
      tokenURL: configService.get<string>('OIDC_TOKEN_URL') || configService.get<string>('oidc.tokenURL'),
      userInfoURL: configService.get<string>('OIDC_USERINFO_URL') || configService.get<string>('oidc.userInfoURL'),
      clientID: configService.get<string>('OIDC_CLIENT_ID') || configService.get<string>('oidc.clientId'),
      clientSecret: configService.get<string>('OIDC_CLIENT_SECRET') || configService.get<string>('oidc.clientSecret'),
      callbackURL: configService.get<string>('OIDC_CALLBACK_URL') || configService.get<string>('oidc.callbackUrl'),
      scope: configService.get<string>('OIDC_SCOPE') || configService.get<string>('oidc.scope') || 'openid profile email',
      // Optional: additional OIDC options
      skipUserProfile: false,
      // PKCE (Proof Key for Code Exchange) for enhanced security
      usePKCE: true,
    });
  }

  async validate(
    issuer: string,
    sub: string,
    profile: Record<string, unknown>,
    accessToken: string,
    refreshToken: string,
    _params: Record<string, unknown>,
  ): Promise<{ id: string; email: string; role: string; brandId: string | null }> {
    try {
      if (!profile) {
        throw new UnauthorizedException('OIDC authentication failed');
      }

      // Extract user information from OIDC profile
      const profileEmail = profile.email ?? (Array.isArray(profile.emails) ? (profile.emails[0] as { value?: string })?.value : undefined) ?? profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
      const firstName = profile.given_name || profile.firstName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'];
      const lastName = profile.family_name || profile.lastName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'];
      const name = (profile.name || profile.displayName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']) as string | undefined;

      if (!profileEmail && !sub) {
        throw new UnauthorizedException('OIDC profile missing required fields (email or sub)');
      }

      // Find or create user using existing OAuth method
      const oauthData = {
        provider: 'oidc',
        providerId: sub,
        email: (profileEmail as string) || sub,
        firstName: (firstName as string) || (typeof name === 'string' ? name.split(' ')[0] : '') || '',
        lastName: (lastName as string) || (typeof name === 'string' ? name.split(' ').slice(1).join(' ') : '') || '',
        accessToken: accessToken || '',
        refreshToken: refreshToken,
      };

      const user = await this.authService.findOrCreateOAuthUser(oauthData);

      this.logger.log(`OIDC authentication successful for user: ${user.email}`);

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        brandId: user.brandId,
      };
    } catch (error) {
      this.logger.error('OIDC authentication validation error', error);
      throw error instanceof UnauthorizedException ? error : new UnauthorizedException('OIDC authentication failed');
    }
  }
}
