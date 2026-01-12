import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { BruteForceService } from './services/brute-force.service';
import { TwoFactorService } from './services/two-factor.service';
import { CaptchaService } from './services/captcha.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
// SAML and OIDC strategies are optional - only load if packages are installed
let SamlStrategy: any = null;
let OidcStrategy: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@node-saml/passport-saml');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SamlStrategy = require('./strategies/saml.strategy').SamlStrategy;
} catch {
  // SAML not available
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('passport-openidconnect');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  OidcStrategy = require('./strategies/oidc.strategy').OidcStrategy;
} catch {
  // OIDC not available
}

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    ...(SamlStrategy ? [SamlStrategy] : []),
    ...(OidcStrategy ? [OidcStrategy] : []),
    BruteForceService,
    TwoFactorService,
    CaptchaService,
    RedisOptimizedService,
  ],
  exports: [AuthService, JwtStrategy, TwoFactorService],
})
export class AuthModule {}
