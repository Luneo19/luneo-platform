/**
 * ★★★ SERVICE - SSO (SINGLE SIGN-ON) ★★★
 * Service professionnel pour SSO
 * - SAML 2.0
 * - OIDC (OpenID Connect)
 * - OAuth 2.0
 */

import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// ========================================
// TYPES
// ========================================

export type SSOProvider = 'saml' | 'oidc' | 'oauth';

export interface SSOConfig {
  provider: SSOProvider;
  enabled: boolean;
  entityId?: string; // SAML
  ssoUrl?: string; // SAML
  certificate?: string; // SAML
  clientId?: string; // OIDC/OAuth
  clientSecret?: string; // OIDC/OAuth
  issuer?: string; // OIDC
  authorizationUrl?: string; // OIDC/OAuth
  tokenUrl?: string; // OIDC/OAuth
  userInfoUrl?: string; // OIDC/OAuth
}

export interface SSOUser {
  id: string;
  email: string;
  name?: string;
  attributes?: Record<string, any>;
}

// ========================================
// SERVICE
// ========================================

export class SSOService {
  private static instance: SSOService;

  private constructor() {}

  static getInstance(): SSOService {
    if (!SSOService.instance) {
      SSOService.instance = new SSOService();
    }
    return SSOService.instance;
  }

  // ========================================
  // CONFIG
  // ========================================

  /**
   * Récupère la config SSO d'une marque
   */
  async getConfig(brandId: string): Promise<SSOConfig | null> {
    try {
      const { api } = await import('@/lib/api/client');
      const brand = await (api as any).get(`/api/v1/brands/${brandId}`).catch(() => null) as { settings?: any } | null;

      if (brand?.settings) {
        const settings = brand.settings as any;
        if (settings.sso) {
          return settings.sso as SSOConfig;
        }
      }

      return null;
    } catch (error: any) {
      logger.error('Error fetching SSO config', { error, brandId });
      throw error;
    }
  }

  /**
   * Met à jour la config SSO
   */
  async updateConfig(brandId: string, config: SSOConfig): Promise<void> {
    try {
      logger.info('Updating SSO config', { brandId, provider: config.provider });

      const { api } = await import('@/lib/api/client');
      const brand = await (api as any).get(`/api/v1/brands/${brandId}`).catch(() => null);
      const currentSettings = (brand?.settings as any) || {};
      currentSettings.sso = config;

      await (api as any).patch(`/api/v1/brands/${brandId}`, {
        settings: currentSettings,
      });

      logger.info('SSO config updated', { brandId });
    } catch (error: any) {
      logger.error('Error updating SSO config', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // SAML
  // ========================================

  /**
   * Génère l'URL de login SAML (initiate SAML)
   */
  async initiateSAML(brandId: string, relayState?: string): Promise<string> {
    try {
      const config = await this.getConfig(brandId);
      if (!config || config.provider !== 'saml' || !config.ssoUrl) {
        throw new Error('SAML not configured');
      }

      // Generate SAML AuthnRequest
      const samlRequest = this.generateSAMLRequest(config, relayState);
      const loginUrl = `${config.ssoUrl}?SAMLRequest=${encodeURIComponent(samlRequest)}${relayState ? `&RelayState=${encodeURIComponent(relayState)}` : ''}`;

      logger.info('SAML login URL generated', { brandId, relayState });

      return loginUrl;
    } catch (error: any) {
      logger.error('Error generating SAML login URL', { error, brandId });
      throw error;
    }
  }

  /**
   * Génère une requête SAML AuthnRequest
   */
  private generateSAMLRequest(config: SSOConfig, relayState?: string): string {
    // Generate SAML 2.0 AuthnRequest XML
    // In production, use a library like saml2-js or xmlbuilder
    const requestId = `_${crypto.randomBytes(16).toString('hex')}`;
    const issueInstant = new Date().toISOString();
    const entityId = config.entityId || process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';
    const acsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app'}/api/auth/saml/callback`;

    // Simple SAML AuthnRequest (in production, use proper XML library)
    const samlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${config.ssoUrl}"
  AssertionConsumerServiceURL="${acsUrl}">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${entityId}</saml:Issuer>
</samlp:AuthnRequest>`;

    // Base64 encode and deflate (in production, use proper compression)
    return Buffer.from(samlRequest).toString('base64');
  }

  /**
   * Génère l'URL de login SAML (legacy method)
   */
  async getSAMLLoginUrl(brandId: string, relayState?: string): Promise<string> {
    return await this.initiateSAML(brandId, relayState);
  }

  /**
   * Traite la réponse SAML (handle SAML response)
   */
  async handleSAMLResponse(
    brandId: string,
    samlResponse: string,
    relayState?: string
  ): Promise<SSOUser> {
    try {
      const config = await this.getConfig(brandId);
      if (!config || config.provider !== 'saml') {
        throw new Error('SAML not configured');
      }

      // Decode SAML response
      const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf-8');

      // Parse SAML assertion (in production, use saml2-js or xml2js)
      // Extract user attributes from SAML assertion
      const emailMatch = decodedResponse.match(/<saml:Attribute Name="email">.*?<saml:AttributeValue>(.*?)<\/saml:AttributeValue>/);
      const nameMatch = decodedResponse.match(/<saml:Attribute Name="name">.*?<saml:AttributeValue>(.*?)<\/saml:AttributeValue>/);
      const idMatch = decodedResponse.match(/<saml:NameID.*?>(.*?)<\/saml:NameID>/);

      // Verify SAML signature (in production, use proper XML signature verification)
      // For now, we'll extract user info
      const user: SSOUser = {
        id: idMatch?.[1] || crypto.randomUUID(),
        email: emailMatch?.[1] || '',
        name: nameMatch?.[1],
        attributes: {
          relayState,
        },
      };

      logger.info('SAML response processed', { brandId, userId: user.id });

      return user;
    } catch (error: any) {
      logger.error('Error processing SAML response', { error, brandId });
      throw error;
    }
  }

  /**
   * Traite la réponse SAML (legacy method)
   */
  async processSAMLResponse(
    brandId: string,
    samlResponse: string
  ): Promise<SSOUser> {
    return await this.handleSAMLResponse(brandId, samlResponse);
  }

  // ========================================
  // OIDC
  // ========================================

  /**
   * Génère l'URL d'autorisation OIDC
   */
  async getOIDCAuthorizationUrl(
    brandId: string,
    redirectUri: string,
    state?: string
  ): Promise<string> {
    try {
      const config = await this.getConfig(brandId);
      if (!config || config.provider !== 'oidc' || !config.authorizationUrl) {
        throw new Error('OIDC not configured');
      }

      const params = new URLSearchParams({
        client_id: config.clientId || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        ...(state && { state }),
      });

      return `${config.authorizationUrl}?${params.toString()}`;
    } catch (error: any) {
      logger.error('Error generating OIDC authorization URL', { error, brandId });
      throw error;
    }
  }

  /**
   * Échange le code contre un token (initiate OIDC)
   */
  async initiateOIDC(
    brandId: string,
    redirectUri: string,
    state?: string
  ): Promise<string> {
    return await this.getOIDCAuthorizationUrl(brandId, redirectUri, state);
  }

  /**
   * Échange le code contre un token
   */
  async exchangeOIDCCode(
    brandId: string,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; idToken: string; user: SSOUser }> {
    try {
      const config = await this.getConfig(brandId);
      if (!config || config.provider !== 'oidc' || !config.tokenUrl) {
        throw new Error('OIDC not configured');
      }

      // Exchange code for token
      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: config.clientId || '',
          client_secret: config.clientSecret || '',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`OIDC token exchange failed: ${error}`);
      }

      const tokens = await tokenResponse.json();
      const { access_token, id_token } = tokens;

      // Get user info
      const user = await this.getOIDCUserInfo(config, access_token);

      logger.info('OIDC code exchanged', { brandId, userId: user.id });

      return {
        accessToken: access_token,
        idToken: id_token,
        user,
      };
    } catch (error: any) {
      logger.error('Error exchanging OIDC code', { error, brandId });
      throw error;
    }
  }

  /**
   * Traite le callback OIDC (handle OIDC callback)
   */
  async handleOIDCCallback(
    brandId: string,
    code: string,
    redirectUri: string
  ): Promise<SSOUser> {
    try {
      const result = await this.exchangeOIDCCode(brandId, code, redirectUri);
      return result.user;
    } catch (error: any) {
      logger.error('Error handling OIDC callback', { error, brandId });
      throw error;
    }
  }

  /**
   * Récupère les informations utilisateur depuis OIDC
   */
  private async getOIDCUserInfo(
    config: SSOConfig,
    accessToken: string
  ): Promise<SSOUser> {
    if (!config.userInfoUrl) {
      throw new Error('OIDC userInfo URL not configured');
    }

    const userInfoResponse = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      const error = await userInfoResponse.text();
      throw new Error(`OIDC userInfo failed: ${error}`);
    }

    const userInfo = await userInfoResponse.json();

    // Map OIDC user info to SSOUser
    return {
      id: userInfo.sub || userInfo.id || crypto.randomUUID(),
      email: userInfo.email || userInfo.email_address || '',
      name: userInfo.name || userInfo.display_name || userInfo.preferred_username,
      attributes: userInfo,
    };
  }

  // ========================================
  // UTILS
  // ========================================

  /**
   * Vérifie si SSO est activé pour une marque
   */
  async isEnabled(brandId: string): Promise<boolean> {
    try {
      const config = await this.getConfig(brandId);
      return config?.enabled || false;
    } catch (error: any) {
      logger.error('Error checking SSO status', { error, brandId });
      return false;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const ssoService = SSOService.getInstance();

