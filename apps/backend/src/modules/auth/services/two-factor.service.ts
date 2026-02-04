import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

/**
 * Service pour l'authentification à deux facteurs (2FA)
 * Utilise TOTP (Time-based One-Time Password) avec speakeasy
 */
@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  /**
   * Génère un secret 2FA pour un utilisateur
   */
  generateSecret(userEmail: string, issuer: string = 'Luneo'): {
    secret: string;
    otpauthUrl: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `${issuer} (${userEmail})`,
      issuer,
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url!,
    };
  }

  /**
   * Vérifie un code TOTP
   */
  verifyToken(secret: string, token: string, window: number = 2): boolean {
    try {
      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window, // Tolérance de 2 périodes (60s chacune)
      });

      return isValid === true;
    } catch (error) {
      this.logger.error('Error verifying 2FA token', error);
      return false;
    }
  }

  /**
   * Génère un QR Code pour l'activation 2FA
   */
  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });

      return qrCodeDataUrl;
    } catch (error) {
      this.logger.error('Error generating QR code', error);
      throw new BadRequestException('Erreur lors de la génération du QR code');
    }
  }

  /**
   * Génère un code de backup (codes de récupération)
   * Utilise crypto pour une génération sécurisée
   */
  generateBackupCodes(count: number = 10): string[] {
    const crypto = require('crypto');
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Générer un code cryptographiquement sécurisé de 8 caractères
      const randomBytes = crypto.randomBytes(6);
      const code = randomBytes.toString('base64')
        .replace(/[+/=]/g, '') // Remove non-alphanumeric characters
        .substring(0, 8)
        .toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Valide un code de backup
   */
  validateBackupCode(backupCodes: string[], code: string): boolean {
    const normalizedCode = code.toUpperCase().trim();
    return backupCodes.includes(normalizedCode);
  }
}
