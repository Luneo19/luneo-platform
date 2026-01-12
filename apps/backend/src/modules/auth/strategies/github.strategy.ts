import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
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
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
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
