/**
 * OAuth Service
 * Centralized OAuth logic and user management
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';

export interface OAuthUser {
  provider: 'google' | 'github' | 'saml' | 'oidc';
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface OAuthConfig {
  google?: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  github?: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  saml?: {
    entryPoint: string;
    issuer: string;
    callbackUrl: string;
    cert: string;
  };
  oidc?: {
    issuer: string;
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get OAuth configuration
   */
  getOAuthConfig(): OAuthConfig {
    return {
      google: this.isGoogleConfigured()
        ? {
            clientId: this.configService.get<string>('oauth.google.clientId') ||
                     this.configService.get<string>('GOOGLE_CLIENT_ID') ||
                     this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID') || '',
            clientSecret: this.configService.get<string>('oauth.google.clientSecret') ||
                         this.configService.get<string>('GOOGLE_CLIENT_SECRET') ||
                         this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET') || '',
            callbackUrl: this.configService.get<string>('oauth.google.callbackUrl') ||
                        this.configService.get<string>('GOOGLE_CALLBACK_URL') ||
                        this.configService.get<string>('GOOGLE_OAUTH_CALLBACK_URL') ||
                        '/api/v1/auth/google/callback',
          }
        : undefined,
      github: this.isGitHubConfigured()
        ? {
            clientId: this.configService.get<string>('oauth.github.clientId') ||
                     this.configService.get<string>('GITHUB_CLIENT_ID') ||
                     this.configService.get<string>('GITHUB_OAUTH_CLIENT_ID') || '',
            clientSecret: this.configService.get<string>('oauth.github.clientSecret') ||
                         this.configService.get<string>('GITHUB_CLIENT_SECRET') ||
                         this.configService.get<string>('GITHUB_OAUTH_CLIENT_SECRET') || '',
            callbackUrl: this.configService.get<string>('oauth.github.callbackUrl') ||
                        this.configService.get<string>('GITHUB_CALLBACK_URL') ||
                        this.configService.get<string>('GITHUB_OAUTH_CALLBACK_URL') ||
                        '/api/v1/auth/github/callback',
          }
        : undefined,
    };
  }

  /**
   * Check if Google OAuth is configured
   */
  isGoogleConfigured(): boolean {
    return !!(
      this.configService.get<string>('oauth.google.clientId') ||
      this.configService.get<string>('GOOGLE_CLIENT_ID') ||
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID')
    );
  }

  /**
   * Check if GitHub OAuth is configured
   */
  isGitHubConfigured(): boolean {
    return !!(
      this.configService.get<string>('oauth.github.clientId') ||
      this.configService.get<string>('GITHUB_CLIENT_ID') ||
      this.configService.get<string>('GITHUB_OAUTH_CLIENT_ID')
    );
  }

  /**
   * Find or create user from OAuth profile
   */
  async findOrCreateOAuthUser(oauthUser: OAuthUser) {
    try {
      // First, try to find existing user by email
      let user = await this.prisma.user.findUnique({
        where: { email: oauthUser.email },
        include: { brand: true },
      });

      if (user) {
        // Check if OAuth account is already linked
        const existingOAuth = await this.prisma.oAuthAccount.findFirst({
          where: {
            userId: user.id,
            provider: oauthUser.provider,
            providerId: oauthUser.providerId,
          },
        });

        if (!existingOAuth) {
          // Link OAuth account to existing user
          await this.prisma.oAuthAccount.create({
            data: {
              userId: user.id,
              provider: oauthUser.provider,
              providerId: oauthUser.providerId,
              accessToken: oauthUser.accessToken,
              refreshToken: oauthUser.refreshToken,
            },
          });
        } else {
          // Update tokens
          await this.prisma.oAuthAccount.update({
            where: { id: existingOAuth.id },
            data: {
              accessToken: oauthUser.accessToken,
              refreshToken: oauthUser.refreshToken,
            },
          });
        }

        this.logger.log(`OAuth account linked to existing user: ${user.email}`);
        return user;
      }

      // Check if OAuth account exists (user might have been deleted)
      const existingOAuth = await this.prisma.oAuthAccount.findFirst({
        where: {
          provider: oauthUser.provider,
          providerId: oauthUser.providerId,
        },
        include: { user: true },
      });

      if (existingOAuth && existingOAuth.user) {
        // Update tokens
        await this.prisma.oAuthAccount.update({
          where: { id: existingOAuth.id },
          data: {
            accessToken: oauthUser.accessToken,
            refreshToken: oauthUser.refreshToken,
          },
        });

        this.logger.log(`OAuth account found for user: ${existingOAuth.user.email}`);
        return existingOAuth.user;
      }

      // Create new user
      const newUser = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          firstName: oauthUser.firstName || '',
          lastName: oauthUser.lastName || '',
          picture: oauthUser.picture,
          isEmailVerified: true, // OAuth providers verify emails
          role: UserRole.CONSUMER,
          oAuthAccounts: {
            create: {
              provider: oauthUser.provider,
              providerId: oauthUser.providerId,
              accessToken: oauthUser.accessToken,
              refreshToken: oauthUser.refreshToken,
            },
          },
        },
        include: { brand: true },
      });

      // Create user quota
      await this.prisma.userQuota.create({
        data: {
          userId: newUser.id,
        },
      });

      this.logger.log(`New OAuth user created: ${newUser.email}`);
      return newUser;
    } catch (error) {
      this.logger.error(`Failed to find or create OAuth user: ${error.message}`, error.stack);
      throw new UnauthorizedException('Failed to authenticate with OAuth provider');
    }
  }

  /**
   * Unlink OAuth account from user
   */
  async unlinkOAuthAccount(userId: string, provider: string) {
    try {
      const deleted = await this.prisma.oAuthAccount.deleteMany({
        where: {
          userId,
          provider: provider as any,
        },
      });

      this.logger.log(`OAuth account unlinked: ${provider} for user ${userId}`);
      return { success: true, deleted: deleted.count };
    } catch (error) {
      this.logger.error(`Failed to unlink OAuth account: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get linked OAuth accounts for user
   */
  async getLinkedAccounts(userId: string) {
    try {
      const accounts = await this.prisma.oAuthAccount.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          providerId: true,
          createdAt: true,
        },
      });

      return accounts;
    } catch (error) {
      this.logger.error(`Failed to get linked accounts: ${error.message}`, error.stack);
      throw error;
    }
  }
}
