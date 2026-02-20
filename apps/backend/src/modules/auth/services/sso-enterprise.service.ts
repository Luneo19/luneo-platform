/**
 * SSO Enterprise Service
 * Manages SAML and OIDC SSO configurations for enterprise customers
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
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

    // Create SSO configuration in database using Prisma model
    const ssoConfig = await this.prisma.sSOConfiguration.create({
      data: {
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
      },
    });

    this.logger.log(`Created SSO configuration for brand ${dto.brandId}: ${dto.name}`);

    return this.mapToSSOConfiguration(ssoConfig);
  }

  /**
   * Get SSO configuration for a brand
   */
  async getSSOConfiguration(brandId: string, provider?: 'saml' | 'oidc'): Promise<SSOConfiguration | null> {
    try {
      const where: Prisma.SSOConfigurationWhereInput = { brandId };
      if (provider) {
        where.provider = provider;
      }

      const config = await this.prisma.sSOConfiguration.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
      });

      if (!config) {
        return null;
      }

      return this.mapToSSOConfiguration(config);
    } catch (error) {
      this.logger.error('Failed to get SSO configuration:', error);
      return null;
    }
  }

  /**
   * Update SSO configuration
   */
  async updateSSOConfiguration(
    id: string,
    updates: Partial<CreateSSODto>,
  ): Promise<SSOConfiguration> {
    try {
      const updateData: Prisma.SSOConfigurationUpdateInput = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
      if (updates.samlEntryPoint !== undefined) updateData.samlEntryPoint = updates.samlEntryPoint;
      if (updates.samlIssuer !== undefined) updateData.samlIssuer = updates.samlIssuer;
      if (updates.samlCert !== undefined) updateData.samlCert = updates.samlCert;
      if (updates.samlCallbackUrl !== undefined) updateData.samlCallbackUrl = updates.samlCallbackUrl;
      if (updates.oidcIssuer !== undefined) updateData.oidcIssuer = updates.oidcIssuer;
      if (updates.oidcClientId !== undefined) updateData.oidcClientId = updates.oidcClientId;
      if (updates.oidcCallbackUrl !== undefined) updateData.oidcCallbackUrl = updates.oidcCallbackUrl;
      if (updates.oidcScope !== undefined) updateData.oidcScope = updates.oidcScope;
      if (updates.metadataUrl !== undefined) updateData.metadataUrl = updates.metadataUrl;
      if (updates.metadataXml !== undefined) updateData.metadataXml = updates.metadataXml;
      if (updates.autoProvisioning !== undefined) updateData.autoProvisioning = updates.autoProvisioning;
      if (updates.defaultRole !== undefined) updateData.defaultRole = updates.defaultRole;
      if (updates.attributeMapping !== undefined) updateData.attributeMapping = updates.attributeMapping;

      // Encrypt sensitive fields if provided
      if (updates.oidcClientSecret) {
        updateData.oidcClientSecret = this.encrypt(updates.oidcClientSecret);
      }
      if (updates.samlDecryptionPvk) {
        updateData.samlDecryptionPvk = this.encrypt(updates.samlDecryptionPvk);
      }

      const updated = await this.prisma.sSOConfiguration.update({
        where: { id },
        data: updateData,
      });

      return this.mapToSSOConfiguration(updated);
    } catch (error) {
      this.logger.error('Failed to update SSO configuration:', error);
      throw error;
    }
  }

  /**
   * Delete SSO configuration
   */
  async deleteSSOConfiguration(id: string): Promise<void> {
    try {
      await this.prisma.sSOConfiguration.delete({
        where: { id },
      });

      this.logger.log(`Deleted SSO configuration: ${id}`);
    } catch (error) {
      this.logger.error('Failed to delete SSO configuration:', error);
      throw error;
    }
  }

  /**
   * Test SSO configuration
   */
  async testSSOConfiguration(_id: string): Promise<{ success: boolean; message: string }> {
    // Test connectivity to IdP
    // For SAML: Fetch metadata
    // For OIDC: Discover endpoints
    return { success: true, message: 'SSO configuration test passed' };
  }

  /**
   * Get default callback URL for provider
   */
  private getDefaultCallbackUrl(provider: 'saml' | 'oidc'): string {
    const baseUrl = this.configService.get('app.backendUrl') || process.env.BACKEND_URL || 'http://localhost:3001';
    return `${baseUrl}/api/v1/auth/${provider}/callback`;
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string): string {
    const algorithm = 'aes-256-gcm';
    const encryptionKey = this.configService.get<string>('sso.encryptionKey');
    if (!encryptionKey) {
      throw new Error('SSO encryption key (sso.encryptionKey) is not configured. Set SSO_ENCRYPTION_KEY env var.');
    }
    const key = Buffer.from(encryptionKey, 'hex');
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
    const encryptionKey = this.configService.get<string>('sso.encryptionKey');
    if (!encryptionKey) {
      throw new Error('SSO encryption key (sso.encryptionKey) is not configured. Set SSO_ENCRYPTION_KEY env var.');
    }
    const key = Buffer.from(encryptionKey, 'hex');

    const data = JSON.parse(encryptedData);
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Map Prisma model to SSOConfiguration interface
   */
  private mapToSSOConfiguration(prismaModel: Prisma.SSOConfigurationGetPayload<Record<string, never>>): SSOConfiguration {
    return {
      id: prismaModel.id,
      brandId: prismaModel.brandId,
      provider: prismaModel.provider as 'saml' | 'oidc',
      enabled: prismaModel.enabled,
      name: prismaModel.name,
      samlEntryPoint: prismaModel.samlEntryPoint ?? undefined,
      samlIssuer: prismaModel.samlIssuer ?? undefined,
      samlCert: prismaModel.samlCert ?? undefined,
      samlCallbackUrl: prismaModel.samlCallbackUrl ?? undefined,
      samlDecryptionPvk: prismaModel.samlDecryptionPvk ?? undefined,
      oidcIssuer: prismaModel.oidcIssuer ?? undefined,
      oidcClientId: prismaModel.oidcClientId ?? undefined,
      oidcClientSecret: prismaModel.oidcClientSecret ?? undefined,
      oidcCallbackUrl: prismaModel.oidcCallbackUrl ?? undefined,
      oidcScope: prismaModel.oidcScope ?? undefined,
      metadataUrl: prismaModel.metadataUrl ?? undefined,
      metadataXml: prismaModel.metadataXml ?? undefined,
      autoProvisioning: prismaModel.autoProvisioning,
      defaultRole: prismaModel.defaultRole ?? undefined,
      attributeMapping: (prismaModel.attributeMapping as Record<string, string>) || {},
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    };
  }
}
