import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PassportGoogle = require('passport-google-oauth20');
const Strategy = PassportGoogle.Strategy;
type VerifyCallback = (error: Error | null, user?: unknown) => void;
import { ConfigService } from '@nestjs/config';
import { OAuthService, OAuthUser } from '../services/oauth.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  private static normalizeGoogleCallbackUrl(raw?: string): string | undefined {
    if (!raw) return undefined;
    // Backward compatibility: old envs sometimes use /api/auth/google/callback.
    if (raw.includes('/api/auth/google/callback')) {
      return raw.replace('/api/auth/google/callback', '/api/v1/auth/google/callback');
    }
    return raw;
  }

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const startupLogger = new Logger(GoogleStrategy.name);
    const nodeEnv = configService.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const oauthStateRaw =
      configService.get<string>('oauth.google.enableState') ??
      configService.get<string>('OAUTH_GOOGLE_ENABLE_STATE');
    const oauthPkceRaw =
      configService.get<string>('oauth.google.enablePkce') ??
      configService.get<string>('OAUTH_GOOGLE_ENABLE_PKCE');
    const oauthStateEnabled = (oauthStateRaw ?? (isProduction ? 'true' : 'false')) === 'true';
    const oauthPkceEnabled = (oauthPkceRaw ?? 'false') === 'true';
    const oauthSessionEnabled =
      (configService.get<string>('OAUTH_SESSION_ENABLED') ?? process.env.OAUTH_SESSION_ENABLED ?? 'false') === 'true';
    const effectiveStateEnabled = oauthStateEnabled && oauthSessionEnabled;

    if (oauthStateRaw == null) {
      startupLogger.warn(
        `Google OAuth state is not explicitly configured (default=${isProduction ? 'true' : 'false'}). Set OAUTH_GOOGLE_ENABLE_STATE explicitly.`,
      );
    }
    if (oauthPkceRaw == null) {
      startupLogger.warn(
        'Google OAuth PKCE is not explicitly configured (default=false). Set OAUTH_GOOGLE_ENABLE_PKCE=true/false explicitly.',
      );
    }

    const clientID = configService.get<string>('oauth.google.clientId') ||
                     configService.get<string>('GOOGLE_CLIENT_ID') ||
                     configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = configService.get<string>('oauth.google.clientSecret') ||
                        configService.get<string>('GOOGLE_CLIENT_SECRET') ||
                        configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const callbackURL = GoogleStrategy.normalizeGoogleCallbackUrl(
      configService.get<string>('oauth.google.callbackUrl') ||
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        configService.get<string>('GOOGLE_OAUTH_CALLBACK_URL'),
    );

    if (!clientID || !clientSecret) {
      throw new Error('Google OAuth clientID and clientSecret are required');
    }
    if (isProduction && !oauthStateEnabled) {
      startupLogger.warn(
        'Google OAuth state is disabled in production. This lowers CSRF protection for OAuth. Prefer enabling sessions + OAUTH_GOOGLE_ENABLE_STATE=true.',
      );
    }
    if (oauthStateEnabled && !oauthSessionEnabled) {
      startupLogger.warn(
        'Google OAuth state requested but OAUTH_SESSION_ENABLED is false. Falling back to stateless OAuth (state disabled) to avoid runtime failures.',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL: callbackURL || '/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
      // State/PKCE can require extra session setup with passport strategies.
      // Keep them configurable to avoid hard prod failures when infra is stateless.
      state: effectiveStateEnabled,
      pkce: oauthPkceEnabled,
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: { id: string; name?: { givenName?: string; familyName?: string }; emails?: Array<{ value: string }>; photos?: Array<{ value: string }> },
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { id, name, emails, photos } = profile;
      
      const user: OAuthUser = {
        provider: 'google' as const,
        providerId: id,
        email: emails?.[0]?.value ?? '',
        firstName: name?.givenName,
        lastName: name?.familyName,
        picture: photos?.[0]?.value,
        accessToken,
        refreshToken,
      };

      // Find or create user in database
      const dbUser = await this.oauthService.findOrCreateOAuthUser(user);
      
      this.logger.log(`Google OAuth successful for user: ${user.email}`);
      
      return done(null, dbUser);
    } catch (error) {
      this.logger.error('Google OAuth validation error', error);
      return done(new UnauthorizedException('Google OAuth authentication failed'), null);
    }
  }
}
