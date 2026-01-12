import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthService, OAuthUser } from '../services/oauth.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const clientID = configService.get<string>('oauth.google.clientId') ||
                     configService.get<string>('GOOGLE_CLIENT_ID') ||
                     configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = configService.get<string>('oauth.google.clientSecret') ||
                        configService.get<string>('GOOGLE_CLIENT_SECRET') ||
                        configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const callbackURL = configService.get<string>('oauth.google.callbackUrl') ||
                       configService.get<string>('GOOGLE_CALLBACK_URL') ||
                       configService.get<string>('GOOGLE_OAUTH_CALLBACK_URL');

    if (!clientID || !clientSecret) {
      throw new Error('Google OAuth clientID and clientSecret are required');
    }

    super({
      clientID,
      clientSecret,
      callbackURL: callbackURL || '/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      
      const user = {
        provider: 'google',
        providerId: id,
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        picture: photos[0].value,
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
