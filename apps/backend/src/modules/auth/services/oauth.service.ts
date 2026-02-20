/**
 * OAuth Service
 * Centralized OAuth logic and user management
 * 
 * SEC-05: Chiffrement AES-256-GCM des tokens OAuth
 */

import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { EncryptionService } from '@/libs/crypto/encryption.service';

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
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * SEC-05: Chiffre un token OAuth pour stockage sécurisé
   */
  private encryptToken(token: string | undefined): string | null {
    if (!token) return null;
    try {
      return this.encryptionService.encrypt(token);
    } catch (error) {
      this.logger.error('Failed to encrypt OAuth token', error);
      throw new InternalServerErrorException('Failed to encrypt OAuth token');
    }
  }

  /**
   * SEC-05: Déchiffre un token OAuth
   * Supporte la migration depuis données non chiffrées
   */
  private decryptToken(encryptedToken: string | null): string | null {
    if (!encryptedToken) return null;
    try {
      return this.encryptionService.decrypt(encryptedToken);
    } catch {
      // Fallback pour les données existantes non chiffrées
      this.logger.warn('Decrypting legacy unencrypted OAuth token - migration recommended');
      return encryptedToken;
    }
  }

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
      const user = await this.prisma.user.findUnique({
        where: { email: oauthUser.email },
        include: { brand: true },
      });

      if (user) {
        // SECURITY FIX: Check if user account is active before allowing OAuth login
        if (!user.isActive) {
          throw new UnauthorizedException('User account is inactive');
        }

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
          // SEC-05: Chiffrer les tokens avant stockage
          await this.prisma.oAuthAccount.create({
            data: {
              userId: user.id,
              provider: oauthUser.provider,
              providerId: oauthUser.providerId,
              accessToken: this.encryptToken(oauthUser.accessToken),
              refreshToken: this.encryptToken(oauthUser.refreshToken),
            },
          });
        } else {
          // Update tokens
          // SEC-05: Chiffrer les tokens avant stockage
          await this.prisma.oAuthAccount.update({
            where: { id: existingOAuth.id },
            data: {
              accessToken: this.encryptToken(oauthUser.accessToken),
              refreshToken: this.encryptToken(oauthUser.refreshToken),
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
        // SEC-05: Chiffrer les tokens avant stockage
        await this.prisma.oAuthAccount.update({
          where: { id: existingOAuth.id },
          data: {
            accessToken: this.encryptToken(oauthUser.accessToken),
            refreshToken: this.encryptToken(oauthUser.refreshToken),
          },
        });

        this.logger.log(`OAuth account found for user: ${existingOAuth.user.email}`);
        return existingOAuth.user;
      }

      // Create new user
      // SEC-05: Chiffrer les tokens OAuth avant stockage
      const newUser = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          firstName: oauthUser.firstName || '',
          lastName: oauthUser.lastName || '',
          avatar: oauthUser.picture || undefined, // Use 'avatar' field instead of 'picture'
          emailVerified: true, // OAuth providers verify emails
          role: UserRole.CONSUMER,
          oauthAccounts: {
            create: {
              provider: oauthUser.provider,
              providerId: oauthUser.providerId,
              accessToken: this.encryptToken(oauthUser.accessToken),
              refreshToken: this.encryptToken(oauthUser.refreshToken),
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
   * SEC-09: Revoke OAuth tokens at provider level before unlinking/logout.
   * Best-effort: logs errors but does not throw (provider may be unavailable).
   *
   * Google: POST https://oauth2.googleapis.com/revoke?token=<token>
   * GitHub: DELETE https://api.github.com/applications/<client_id>/token
   */
  async revokeProviderTokens(userId: string, provider?: string): Promise<void> {
    try {
      const whereClause: { userId: string; provider?: string } = { userId };
      if (provider) whereClause.provider = provider;

      const accounts = await this.prisma.oAuthAccount.findMany({
        where: whereClause,
        select: { id: true, provider: true, accessToken: true, refreshToken: true },
      });

      for (const account of accounts) {
        const accessToken = this.decryptToken(account.accessToken);
        if (!accessToken) continue;

        try {
          if (account.provider === 'google') {
            await this.revokeGoogleToken(accessToken);
          } else if (account.provider === 'github') {
            await this.revokeGitHubToken(accessToken);
          }
          this.logger.log(`SEC-09: Revoked ${account.provider} token for user ${userId}`);
        } catch (revokeError) {
          // Best-effort: log but don't fail the operation
          this.logger.warn(
            `SEC-09: Failed to revoke ${account.provider} token for user ${userId}: ${revokeError instanceof Error ? revokeError.message : revokeError}`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `SEC-09: Error fetching OAuth accounts for revocation: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Revoke Google OAuth token
   * https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke
   */
  private async revokeGoogleToken(token: string): Promise<void> {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );
    if (!response.ok && response.status !== 400) {
      // 400 = already revoked/invalid — acceptable
      throw new Error(`Google revocation failed: ${response.status}`);
    }
  }

  /**
   * Revoke GitHub OAuth token
   * https://docs.github.com/en/rest/apps/oauth-applications#delete-an-app-token
   */
  private async revokeGitHubToken(token: string): Promise<void> {
    const clientId =
      this.configService.get<string>('oauth.github.clientId') ||
      this.configService.get<string>('GITHUB_CLIENT_ID') ||
      this.configService.get<string>('GITHUB_OAUTH_CLIENT_ID');
    const clientSecret =
      this.configService.get<string>('oauth.github.clientSecret') ||
      this.configService.get<string>('GITHUB_CLIENT_SECRET') ||
      this.configService.get<string>('GITHUB_OAUTH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.warn('SEC-09: GitHub OAuth credentials missing, cannot revoke token');
      return;
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(
      `https://api.github.com/applications/${clientId}/token`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token }),
      },
    );
    if (!response.ok && response.status !== 404 && response.status !== 422) {
      // 404/422 = token already invalid — acceptable
      throw new Error(`GitHub revocation failed: ${response.status}`);
    }
  }

  /**
   * Unlink OAuth account from user.
   * SEC-09: Revokes provider tokens before deleting.
   */
  async unlinkOAuthAccount(userId: string, provider: string) {
    try {
      // SEC-09: Revoke tokens at provider level before deleting
      await this.revokeProviderTokens(userId, provider);

      const deleted = await this.prisma.oAuthAccount.deleteMany({
        where: {
          userId,
          provider,
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
