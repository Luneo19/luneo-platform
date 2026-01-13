import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as SamlPassportStrategy } from '@node-saml/passport-saml';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * SAML Strategy for Enterprise SSO
 * Supports SAML 2.0 authentication protocol
 * 
 * Configuration required:
 * - SAML_ENTRY_POINT: SAML IdP entry point URL
 * - SAML_ISSUER: SAML issuer (your application identifier)
 * - SAML_CERT: SAML certificate from IdP
 * - SAML_CALLBACK_URL: Callback URL for SAML responses
 * 
 * NOTE: This strategy is disabled until @node-saml/passport-saml is installed
 */
@Injectable()
export class SamlStrategy extends PassportStrategy(SamlPassportStrategy, 'saml') {
  private readonly logger = new Logger(SamlStrategy.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      entryPoint: configService.get<string>('SAML_ENTRY_POINT') || configService.get<string>('saml.entryPoint'),
      issuer: configService.get<string>('SAML_ISSUER') || configService.get<string>('saml.issuer'),
      callbackUrl: configService.get<string>('SAML_CALLBACK_URL') || configService.get<string>('saml.callbackUrl'),
      cert: configService.get<string>('SAML_CERT') || configService.get<string>('saml.cert'),
      // Optional: decrypt encrypted assertions
      decryptionPvk: configService.get<string>('SAML_DECRYPTION_PVK') || configService.get<string>('saml.decryptionPvk'),
      // Optional: signature validation
      signatureAlgorithm: 'sha256',
      // Optional: additional SAML options
      additionalParams: {},
      additionalAuthorizeParams: {},
      // Force authentication even if user is already authenticated
      forceAuthn: false,
      // Allow unencrypted assertions (not recommended for production)
      disableRequestedAuthnContext: false,
    });
  }

  async validate(profile: any): Promise<any> {
    try {
      if (!profile) {
        throw new UnauthorizedException('SAML authentication failed');
      }

      // Extract user information from SAML profile
      const email = profile.email || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || profile['urn:oid:0.9.2342.19200300.100.1.3'];
      const firstName = profile.firstName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || profile['urn:oid:2.5.4.42'];
      const lastName = profile.lastName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || profile['urn:oid:2.5.4.4'];
      const nameId = profile.nameID || profile.nameId || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

      if (!email && !nameId) {
        throw new UnauthorizedException('SAML profile missing required fields (email or nameID)');
      }

      // Find or create user using existing OAuth method
      // Note: SAML doesn't use access tokens, so we use empty strings
      const oauthData = {
        provider: 'saml',
        providerId: nameId || email,
        email: email || nameId,
        firstName: firstName || '',
        lastName: lastName || '',
        accessToken: '', // SAML doesn't use access tokens
        refreshToken: undefined,
      };

      const user = await this.authService.findOrCreateOAuthUser(oauthData);

      this.logger.log(`SAML authentication successful for user: ${user.email}`);

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        brandId: user.brandId,
      };
    } catch (error) {
      this.logger.error('SAML authentication validation error', error);
      throw error instanceof UnauthorizedException ? error : new UnauthorizedException('SAML authentication failed');
    }
  }
}
