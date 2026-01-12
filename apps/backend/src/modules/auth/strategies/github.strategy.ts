import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('oauth.github.clientId'),
      clientSecret: configService.get<string>('oauth.github.clientSecret'),
      callbackURL: configService.get<string>('oauth.github.callbackUrl'),
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
      
      const user = {
        provider: 'github',
        providerId: id.toString(),
        email: emails?.[0]?.value || `${username}@github.noreply`,
        firstName: displayName || username,
        lastName: '',
        picture: photos?.[0]?.value,
        accessToken,
        refreshToken,
      };

      // Find or create user in database
      const dbUser = await this.authService.findOrCreateOAuthUser(user);
      
      this.logger.log(`GitHub OAuth successful for user: ${user.email}`);
      
      return done(null, dbUser);
    } catch (error) {
      this.logger.error('GitHub OAuth validation error', error);
      return done(error, null);
    }
  }
}
