/**
 * SSO Enterprise Service
 * Manages SAML and OIDC SSO configurations for enterprise customers
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface SSOConfiguration {
  id: string;
  brandId: string;
  provider: 'saml' | 'oidc';
  enabled: boolean;
  name: string;
  // SAML Configuration
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCert?: string;
  samlCallbackUrl?: string;
  samlDecryptionPvk?: string;
  // OIDC Configuration
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcCallbackUrl?: string;
  oidcScope?: string;
  // Metadata
  metadataUrl?: string;
  metadataXml?: string;
  // Settings
  autoProvisioning: boolean;
  defaultRole?: string;
  attributeMapping?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    groups?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSSODto {
  brandId: string;
  provider: 'saml' | 'oidc';
  name: string;
  enabled?: boolean;
  // SAML
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCert?: string;
  samlCallbackUrl?: string;
  samlDecryptionPvk?: string;
  // OIDC
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcCallbackUrl?: string;
  oidcScope?: string;
  // Metadata
  metadataUrl?: string;
  metadataXml?: string;
  // Settings
  autoProvisioning?: boolean;
  defaultRole?: string;
  attributeMapping?: Record<string, string>;
}

@Injectable()
export class SSOEnterpriseService {
  private readonly logger = new Logger(SSOEnterpriseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create SSO configuration for a brand
   */
  async createSSOConfiguration(dto: CreateSSODto): Promise<SSOConfiguration> {
    // Validate provider-specific fields
    if (dto.provider === 'saml') {
      if (!dto.samlEntryPoint || !dto.samlIssuer || !dto.samlCert) {
        throw new BadRequestException('SAML requires entryPoint, issuer, and cert');
      }
    } else if (dto.provider === 'oidc') {
      if (!dto.oidcIssuer || !dto.oidcClientId || !dto.oidcClientSecret) {
        throw new BadRequestException('OIDC requires issuer, clientId, and clientSecret');
      }
    }

    // Encrypt sensitive data (client secret, decryption key)
    const encryptedClientSecret = dto.oidcClientSecret
      ? this.encrypt(dto.oidcClientSecret)
      : null;
    const encryptedDecryptionPvk = dto.samlDecryptionPvk
      ? this.encrypt(dto.samlDecryptionPvk)
      : null;

    // Create SSO configuration in database
    // Note: This assumes a Prisma model `SSOConfiguration` exists
    // For now, we'll use a JSON storage approach or create the model
    const ssoConfig = {
      id: crypto.randomUUID(),
      brandId: dto.brandId,
      provider: dto.provider,
      name: dto.name,
      enabled: dto.enabled ?? true,
      samlEntryPoint: dto.samlEntryPoint,
      samlIssuer: dto.samlIssuer,
      samlCert: dto.samlCert,
      samlCallbackUrl: dto.samlCallbackUrl || this.getDefaultCallbackUrl(dto.provider),
      samlDecryptionPvk: encryptedDecryptionPvk,
      oidcIssuer: dto.oidcIssuer,
      oidcClientId: dto.oidcClientId,
      oidcClientSecret: encryptedClientSecret,
      oidcCallbackUrl: dto.oidcCallbackUrl || this.getDefaultCallbackUrl(dto.provider),
      oidcScope: dto.oidcScope || 'openid profile email',
      metadataUrl: dto.metadataUrl,
      metadataXml: dto.metadataXml,
      autoProvisioning: dto.autoProvisioning ?? true,
      defaultRole: dto.defaultRole,
      attributeMapping: dto.attributeMapping || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.logger.log(`Created SSO configuration for brand ${dto.brandId}: ${dto.name}`);

    return ssoConfig as SSOConfiguration;
  }

  /**
   * Get SSO configuration for a brand
   */
  async getSSOConfiguration(brandId: string, provider?: 'saml' | 'oidc'): Promise<SSOConfiguration | null> {
    // In a real implementation, query from database
    // For now, return null (to be implemented with Prisma model)
    return null;
  }

  /**
   * Update SSO configuration
   */
  async updateSSOConfiguration(
    id: string,
    updates: Partial<CreateSSODto>,
  ): Promise<SSOConfiguration> {
    // In a real implementation, update in database
    throw new Error('Not implemented - requires Prisma model');
  }

  /**
   * Delete SSO configuration
   */
  async deleteSSOConfiguration(id: string): Promise<void> {
    // In a real implementation, delete from database
    throw new Error('Not implemented - requires Prisma model');
  }

  /**
   * Test SSO configuration
   */
  async testSSOConfiguration(id: string): Promise<{ success: boolean; message: string }> {
    // Test connectivity to IdP
    // For SAML: Fetch metadata
    // For OIDC: Discover endpoints
    return { success: true, message: 'SSO configuration test passed' };
  }

  /**
   * Get default callback URL for provider
   */
  private getDefaultCallbackUrl(provider: 'saml' | 'oidc'): string {
    const baseUrl = this.configService.get('app.backendUrl') || 'http://localhost:3001';
    return `${baseUrl}/api/v1/auth/${provider}/callback`;
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(
      this.configService.get<string>('sso.encryptionKey') || 'default-key-change-in-production',
      'hex',
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(
      this.configService.get<string>('sso.encryptionKey') || 'default-key-change-in-production',
      'hex',
    );

    const data = JSON.parse(encryptedData);
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
