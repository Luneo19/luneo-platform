import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Strategy = require('passport-github2');
import { ConfigService } from '@nestjs/config';
import { OAuthService, OAuthUser } from '../services/oauth.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const startupLogger = new Logger(GitHubStrategy.name);
    const oauthStateRaw =
      configService.get<string>('oauth.github.enableState') ??
      configService.get<string>('OAUTH_GITHUB_ENABLE_STATE');
    const oauthStateEnabled = (oauthStateRaw ?? 'false') === 'true';

    if (oauthStateRaw == null) {
      startupLogger.warn(
        'GitHub OAuth state is not explicitly configured (default=false). Set OAUTH_GITHUB_ENABLE_STATE=true/false explicitly.',
      );
    }

    const clientID = configService.get<string>('oauth.github.clientId') ||
                     configService.get<string>('GITHUB_CLIENT_ID') ||
                     configService.get<string>('GITHUB_OAUTH_CLIENT_ID');
    const clientSecret = configService.get<string>('oauth.github.clientSecret') ||
                        configService.get<string>('GITHUB_CLIENT_SECRET') ||
                        configService.get<string>('GITHUB_OAUTH_CLIENT_SECRET');
    const callbackURL = configService.get<string>('oauth.github.callbackUrl') ||
                       configService.get<string>('GITHUB_CALLBACK_URL') ||
                       configService.get<string>('GITHUB_OAUTH_CALLBACK_URL');

    if (!clientID || !clientSecret) {
      throw new Error('GitHub OAuth clientID and clientSecret are required');
    }

    super({
      clientID,
      clientSecret,
      callbackURL: callbackURL || '/api/v1/auth/github/callback',
      scope: ['user:email'],
      // Keep configurable to avoid hard failures in stateless deployments.
      state: oauthStateEnabled,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: { id: string; username?: string; displayName?: string; photos?: Array<{ value: string }>; emails?: Array<{ value: string }> },
    done: (err: Error | null, user: unknown) => void,
  ): Promise<void> {
    try {
      const { id, username, displayName, photos, emails } = profile;
      
      const user: OAuthUser = {
        provider: 'github' as const,
        providerId: id.toString(),
        email: emails?.[0]?.value || `${username}@github.noreply`,
        firstName: displayName || username,
        lastName: '',
        picture: photos?.[0]?.value,
        accessToken,
        refreshToken,
      };

      // Find or create user in database
      const dbUser = await this.oauthService.findOrCreateOAuthUser(user);
      
      this.logger.log(`GitHub OAuth successful for user: ${user.email}`);
      
      return done(null, dbUser);
    } catch (error) {
      this.logger.error('GitHub OAuth validation error', error);
      return done(new UnauthorizedException('GitHub OAuth authentication failed'), null);
    }
  }
}
