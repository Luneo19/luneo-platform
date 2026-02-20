import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { OAuthController } from './controllers/oauth.controller';
import { SSOEnterpriseController } from './controllers/sso-enterprise.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { CryptoModule } from '@/libs/crypto/crypto.module';
import { BruteForceService } from './services/brute-force.service';
import { TwoFactorService } from './services/two-factor.service';
import { CaptchaService } from './services/captcha.service';
import { OAuthService } from './services/oauth.service';
import { SSOEnterpriseService } from './services/sso-enterprise.service';
import { TokenService } from './services/token.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { TokenBlacklistService } from '@/libs/auth/token-blacklist.service';
import { TokenCleanupScheduler } from './schedulers/token-cleanup.scheduler';
import { RbacModule } from '@/modules/security/rbac.module';
import { ReferralModule } from '@/modules/referral/referral.module';

// Helper function to check if OAuth is configured
function isOAuthConfigured(provider: 'google' | 'github'): boolean {
  const env = process.env;
  if (provider === 'google') {
    return !!(
      env.GOOGLE_CLIENT_ID ||
      env.GOOGLE_OAUTH_CLIENT_ID ||
      env['oauth.google.clientId']
    );
  }
  if (provider === 'github') {
    return !!(
      env.GITHUB_CLIENT_ID ||
      env.GITHUB_OAUTH_CLIENT_ID ||
      env['oauth.github.clientId']
    );
  }
  return false;
}

// OAuth strategies are optional - only load if configured (typed as Provider for Nest providers array)
import type { Type } from '@nestjs/common';
let GoogleStrategy: Type | null = null;
let GitHubStrategy: Type | null = null;
let SamlStrategy: Type | null = null;
let OidcStrategy: Type | null = null;

// Check if Google OAuth is configured
if (isOAuthConfigured('google')) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    GoogleStrategy = require('./strategies/google.strategy').GoogleStrategy;
  } catch {
    // Google Strategy not available
  }
}

// Check if GitHub OAuth is configured
if (isOAuthConfigured('github')) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    GitHubStrategy = require('./strategies/github.strategy').GitHubStrategy;
  } catch {
    // GitHub Strategy not available
  }
}

// SAML and OIDC strategies are optional - only load if packages are installed AND configured
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@node-saml/passport-saml');
  // Only load SAML strategy if callbackUrl is configured (required by SAML library)
  const samlCallbackUrl = process.env.SAML_CALLBACK_URL;
  if (samlCallbackUrl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SamlStrategy = require('./strategies/saml.strategy').SamlStrategy;
  }
} catch {
  // SAML not available or not configured
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('passport-openidconnect');
  // Only load OIDC strategy if issuer is configured (required by OIDC library)
  const oidcIssuer = process.env.OIDC_ISSUER;
  if (oidcIssuer) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    OidcStrategy = require('./strategies/oidc.strategy').OidcStrategy;
  }
} catch {
  // OIDC not available or not configured
}

@Module({
  imports: [
    RbacModule,
    ReferralModule,
    PrismaModule,
    PassportModule,
    EmailModule,
    CryptoModule, // SEC-05: Pour chiffrement OAuth tokens
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
  controllers: [AuthController, OAuthController, SSOEnterpriseController],
  providers: [
    AuthService,
    JwtStrategy,
    ...(GoogleStrategy ? [GoogleStrategy as Type] : []),
    ...(GitHubStrategy ? [GitHubStrategy as Type] : []),
    ...(SamlStrategy ? [SamlStrategy as Type] : []),
    ...(OidcStrategy ? [OidcStrategy as Type] : []),
    BruteForceService,
    TwoFactorService,
    CaptchaService,
    OAuthService,
    SSOEnterpriseService,
    TokenService,
    RedisOptimizedService,
    TokenBlacklistService, // SECURITY FIX: Access token blacklist for immediate revocation
    TokenCleanupScheduler, // SEC-08: Nettoyage automatique des tokens
  ],
  exports: [AuthService, JwtStrategy, TwoFactorService, OAuthService, SSOEnterpriseService, TokenBlacklistService],
})
export class AuthModule {}
