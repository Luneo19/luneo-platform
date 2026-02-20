import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import * as crypto from 'crypto';

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  async generateAuthUrl(brandId: string, redirectUri: string, scopes: string[] = []): Promise<{ authUrl: string; state: string }> {
    const state = crypto.randomBytes(32).toString('hex');
    const cacheKey = `oauth:state:${state}`;
    
    // Store state with brand context
    await this.cache.setSimple(cacheKey, JSON.stringify({
      brandId,
      redirectUri,
      scopes,
      createdAt: new Date().toISOString(),
    }), 600); // 10 minutes TTL

    // In a real implementation, this would generate the actual OAuth URL
    const authUrl = `${process.env.OAUTH_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/authorize?` +
      `client_id=${process.env.OAUTH_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scopes.join(' ')}&` +
      `state=${state}&` +
      `response_type=code`;

    return { authUrl, state };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    // Verify state
    const stateDataStr = await this.cache.getSimple<string>(`oauth:state:${state}`);
    if (!stateDataStr) {
      throw new UnauthorizedException('Invalid or expired state');
    }
    
    const stateData = JSON.parse(stateDataStr) as Record<string, string>;

    // In a real implementation, this would make a request to the OAuth provider
    // For now, we'll simulate the token exchange
    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresIn = 3600; // 1 hour

    // Store tokens
    await this.cache.setSimple(`oauth:access_token:${accessToken}`, JSON.stringify({
      brandId: stateData.brandId,
      scopes: stateData.scopes,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    }), expiresIn);

    await this.cache.setSimple(`oauth:refresh_token:${refreshToken}`, JSON.stringify({
      brandId: stateData.brandId,
      accessToken,
    }), 86400 * 30); // 30 days

    // Clean up state
    await this.cache.delSimple(`oauth:state:${state}`);

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<{ brandId: string; scopes: string[] }> {
    const tokenDataStr = await this.cache.getSimple<string>(`oauth:access_token:${token}`);
    if (!tokenDataStr) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const tokenData = JSON.parse(tokenDataStr) as Record<string, unknown>;
    return {
      brandId: tokenData.brandId as string,
      scopes: tokenData.scopes as string[],
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const refreshDataStr = await this.cache.getSimple<string>(`oauth:refresh_token:${refreshToken}`);
    if (!refreshDataStr) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    
    const refreshData = JSON.parse(refreshDataStr) as Record<string, unknown>;

    // Generate new access token
    const newAccessToken = crypto.randomBytes(32).toString('hex');
    const expiresIn = 3600; // 1 hour

    // Store new access token
    await this.cache.setSimple(`oauth:access_token:${newAccessToken}`, JSON.stringify({
      brandId: refreshData.brandId,
      scopes: [], // In real implementation, get from original token
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    }), expiresIn);

    return { accessToken: newAccessToken, expiresIn };
  }

  /**
   * Revoke access token
   */
  async revokeAccessToken(token: string): Promise<void> {
    const tokenDataStr = await this.cache.getSimple(`oauth:access_token:${token}`);
    if (tokenDataStr) {
      await this.cache.delSimple(`oauth:access_token:${token}`);
      
      // Also revoke associated refresh token if exists
      // In a real implementation, you'd need to track this relationship
    }
  }

  /**
   * Get OAuth client configuration
   */
  async getClientConfig(_brandId: string): Promise<{
    clientId: string;
    redirectUris: string[];
    scopes: string[];
  }> {
    // In a real implementation, this would come from the database
    return {
      clientId: process.env.OAUTH_CLIENT_ID || 'luneo-client',
      redirectUris: [
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`,
      ],
      scopes: [
        'designs:read',
        'designs:write',
        'orders:read',
        'orders:write',
        'analytics:read',
      ],
    };
  }
}
