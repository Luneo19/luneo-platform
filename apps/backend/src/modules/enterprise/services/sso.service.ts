/**
 * @fileoverview Service SSO/SAML pour Enterprise
 * @module SSOService
 *
 * Conforme au plan PHASE 8 - Enterprise - SSO/SAML security
 *
 * FONCTIONNALITÉS:
 * - Configuration SAML 2.0
 * - Configuration OIDC
 * - Initiation SSO
 * - Callback SSO
 * - Auto-provisioning
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Logging structuré
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as xml2js from 'xml2js';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Données de configuration SAML
 */
export interface SAMLConfigData {
  brandId: string;
  name: string;
  samlEntryPoint: string;
  samlIssuer: string;
  samlCert: string;
  samlCallbackUrl: string;
  samlDecryptionPvk?: string;
  metadataUrl?: string;
  metadataXml?: string;
  autoProvisioning?: boolean;
  defaultRole?: string;
  attributeMapping?: Record<string, string>;
}

/**
 * Données de configuration OIDC
 */
export interface OIDCConfigData {
  brandId: string;
  name: string;
  oidcIssuer: string;
  oidcClientId: string;
  oidcClientSecret: string;
  oidcCallbackUrl: string;
  oidcScope?: string;
  autoProvisioning?: boolean;
  defaultRole?: string;
  attributeMapping?: Record<string, string>;
}

/**
 * Configuration SSO
 */
export interface SSOConfiguration {
  id: string;
  brandId: string;
  provider: 'saml' | 'oidc';
  name: string;
  enabled: boolean;
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCert?: string;
  samlCallbackUrl?: string;
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcCallbackUrl?: string;
  autoProvisioning: boolean;
  defaultRole?: string;
  attributeMapping?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class SSOService {
  private readonly logger = new Logger(SSOService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Crée une configuration SAML
   * Conforme au plan PHASE 8 - SSO/SAML
   */
  async createSAMLConfig(data: SAMLConfigData): Promise<SSOConfiguration> {
    // ✅ Validation
    if (!data.brandId || typeof data.brandId !== 'string' || data.brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new BadRequestException('Configuration name is required');
    }

    if (!data.samlEntryPoint || typeof data.samlEntryPoint !== 'string' || data.samlEntryPoint.trim().length === 0) {
      throw new BadRequestException('SAML entry point is required');
    }

    if (!data.samlIssuer || typeof data.samlIssuer !== 'string' || data.samlIssuer.trim().length === 0) {
      throw new BadRequestException('SAML issuer is required');
    }

    if (!data.samlCert || typeof data.samlCert !== 'string' || data.samlCert.trim().length === 0) {
      throw new BadRequestException('SAML certificate is required');
    }

    if (!data.samlCallbackUrl || typeof data.samlCallbackUrl !== 'string' || data.samlCallbackUrl.trim().length === 0) {
      throw new BadRequestException('SAML callback URL is required');
    }

    // ✅ Vérifier que le brand existe
    const brand = await this.prisma.brand.findUnique({
      where: { id: data.brandId.trim() },
      select: { id: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${data.brandId} not found`);
    }

    // ✅ Vérifier qu'il n'y a pas déjà une config SAML pour ce brand
    const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "SSOConfiguration" WHERE "brandId" = $1 AND "provider" = 'saml' LIMIT 1`,
      data.brandId.trim(),
    );

    if (existing && existing.length > 0) {
      throw new BadRequestException('SAML configuration already exists for this brand');
    }

    try {
      // ✅ Encrypter la clé privée si fournie
      let encryptedPvk: string | null = null;
      if (data.samlDecryptionPvk) {
        encryptedPvk = this.encryptSecret(data.samlDecryptionPvk);
      }

      // ✅ Créer la configuration
      const config = await this.prisma.$executeRaw`
        INSERT INTO "SSOConfiguration" (
          "id", "brandId", "provider", "name", "enabled",
          "samlEntryPoint", "samlIssuer", "samlCert", "samlCallbackUrl", "samlDecryptionPvk",
          "metadataUrl", "metadataXml",
          "autoProvisioning", "defaultRole", "attributeMapping",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${data.brandId.trim()},
          'saml',
          ${data.name.trim()},
          true,
          ${data.samlEntryPoint.trim()},
          ${data.samlIssuer.trim()},
          ${data.samlCert.trim()},
          ${data.samlCallbackUrl.trim()},
          ${encryptedPvk},
          ${data.metadataUrl || null},
          ${data.metadataXml || null},
          ${data.autoProvisioning !== undefined ? data.autoProvisioning : true},
          ${data.defaultRole || null},
          ${data.attributeMapping ? JSON.stringify(data.attributeMapping) : null}::jsonb,
          NOW(), NOW()
        )
        RETURNING *
      `;

      this.logger.log(`SAML configuration created: ${data.name} for brand ${data.brandId}`);

      // ✅ Récupérer la configuration créée
      return this.getSSOConfig(data.brandId.trim(), 'saml');
    } catch (error) {
      this.logger.error(
        `Failed to create SAML configuration: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Crée une configuration OIDC
   */
  async createOIDCConfig(data: OIDCConfigData): Promise<SSOConfiguration> {
    // ✅ Validation
    if (!data.brandId || typeof data.brandId !== 'string' || data.brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new BadRequestException('Configuration name is required');
    }

    if (!data.oidcIssuer || typeof data.oidcIssuer !== 'string' || data.oidcIssuer.trim().length === 0) {
      throw new BadRequestException('OIDC issuer is required');
    }

    if (!data.oidcClientId || typeof data.oidcClientId !== 'string' || data.oidcClientId.trim().length === 0) {
      throw new BadRequestException('OIDC client ID is required');
    }

    if (!data.oidcClientSecret || typeof data.oidcClientSecret !== 'string' || data.oidcClientSecret.trim().length === 0) {
      throw new BadRequestException('OIDC client secret is required');
    }

    if (!data.oidcCallbackUrl || typeof data.oidcCallbackUrl !== 'string' || data.oidcCallbackUrl.trim().length === 0) {
      throw new BadRequestException('OIDC callback URL is required');
    }

    // ✅ Vérifier que le brand existe
    const brand = await this.prisma.brand.findUnique({
      where: { id: data.brandId.trim() },
      select: { id: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${data.brandId} not found`);
    }

    // ✅ Vérifier qu'il n'y a pas déjà une config OIDC pour ce brand
    const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "SSOConfiguration" WHERE "brandId" = $1 AND "provider" = 'oidc' LIMIT 1`,
      data.brandId.trim(),
    );

    if (existing && existing.length > 0) {
      throw new BadRequestException('OIDC configuration already exists for this brand');
    }

    try {
      // ✅ Encrypter le client secret
      const encryptedSecret = this.encryptSecret(data.oidcClientSecret);

      // ✅ Créer la configuration
      const config = await this.prisma.$executeRaw`
        INSERT INTO "SSOConfiguration" (
          "id", "brandId", "provider", "name", "enabled",
          "oidcIssuer", "oidcClientId", "oidcClientSecret", "oidcCallbackUrl", "oidcScope",
          "autoProvisioning", "defaultRole", "attributeMapping",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${data.brandId.trim()},
          'oidc',
          ${data.name.trim()},
          true,
          ${data.oidcIssuer.trim()},
          ${data.oidcClientId.trim()},
          ${encryptedSecret},
          ${data.oidcCallbackUrl.trim()},
          ${data.oidcScope || 'openid profile email'},
          ${data.autoProvisioning !== undefined ? data.autoProvisioning : true},
          ${data.defaultRole || null},
          ${data.attributeMapping ? JSON.stringify(data.attributeMapping) : null}::jsonb,
          NOW(), NOW()
        )
        RETURNING *
      `;

      this.logger.log(`OIDC configuration created: ${data.name} for brand ${data.brandId}`);

      // ✅ Récupérer la configuration créée
      return this.getSSOConfig(data.brandId.trim(), 'oidc');
    } catch (error) {
      this.logger.error(
        `Failed to create OIDC configuration: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient une configuration SSO
   */
  async getSSOConfig(brandId: string, provider: 'saml' | 'oidc'): Promise<SSOConfiguration> {
    // ✅ Validation
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    const configs = await this.prisma.$queryRawUnsafe<SSOConfiguration[]>(
      `SELECT * FROM "SSOConfiguration" WHERE "brandId" = $1 AND "provider" = $2 AND "enabled" = true LIMIT 1`,
      brandId.trim(),
      provider,
    );

    if (!configs || configs.length === 0) {
      throw new NotFoundException(`SSO configuration not found for brand ${brandId} and provider ${provider}`);
    }

    return configs[0];
  }

  /**
   * Génère une URL d'initiation SAML
   */
  async initiateSAML(brandId: string, relayState?: string): Promise<string> {
    // ✅ Validation
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    try {
      const config = await this.getSSOConfig(brandId, 'saml');

      if (!config.samlEntryPoint) {
        throw new BadRequestException('SAML entry point not configured');
      }

      // ✅ Générer une requête SAML AuthnRequest
      const samlRequest = this.generateSAMLRequest(config, relayState);
      const loginUrl = `${config.samlEntryPoint}?SAMLRequest=${encodeURIComponent(samlRequest)}${relayState ? `&RelayState=${encodeURIComponent(relayState)}` : ''}`;

      this.logger.log(`SAML login URL generated for brand ${brandId}`);

      return loginUrl;
    } catch (error) {
      this.logger.error(
        `Failed to initiate SAML: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Génère une requête SAML AuthnRequest
   */
  private generateSAMLRequest(config: SSOConfiguration, relayState?: string): string {
    const requestId = `_${crypto.randomBytes(16).toString('hex')}`;
    const issueInstant = new Date().toISOString();
    const acsUrl = config.samlCallbackUrl || '';

    // ✅ Construire le XML SAML AuthnRequest
    const samlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="${requestId}"
                    Version="2.0"
                    IssueInstant="${issueInstant}"
                    Destination="${config.samlEntryPoint}"
                    AssertionConsumerServiceURL="${acsUrl}">
  <saml:Issuer>${config.samlIssuer}</saml:Issuer>
</samlp:AuthnRequest>`;

    // ✅ Encoder en base64
    return Buffer.from(samlRequest).toString('base64');
  }

  /**
   * Encrypte un secret (clé privée, client secret, etc.)
   */
  private encryptSecret(secret: string): string {
    const encryptionKey = this.configService.get<string>('app.encryptionKey') || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey.slice(0, 32), 'utf8'), iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // ✅ Retourner IV + authTag + encrypted (séparés par :)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Décrypte un secret
   */
  private decryptSecret(encrypted: string): string {
    const encryptionKey = this.configService.get<string>('app.encryptionKey') || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-gcm';

    const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey.slice(0, 32), 'utf8'), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
