import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { hashBackupCode, verifyBackupCode } from '@/libs/crypto/password-hasher';
import * as crypto from 'crypto';

/**
 * Service pour l'authentification à deux facteurs (2FA)
 * Utilise TOTP (Time-based One-Time Password) avec speakeasy
 * SEC-07: Les backup codes sont hashés avec Argon2id (migration progressive depuis bcrypt)
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
   * Génère des codes de backup (codes de récupération)
   * Utilise crypto pour une génération sécurisée
   * SEC-07: Retourne plaintext pour affichage unique ET hashs pour stockage
   */
  async generateBackupCodes(count: number = 10): Promise<{
    plaintextCodes: string[];
    hashedCodes: string[];
  }> {
    const plaintextCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Générer un code cryptographiquement sécurisé de 8 caractères
      const randomBytes = crypto.randomBytes(6);
      const code = randomBytes.toString('base64')
        .replace(/[+/=]/g, '') // Remove non-alphanumeric characters
        .substring(0, 8)
        .toUpperCase();
      
      plaintextCodes.push(code);
      
      // Hash backup code with Argon2id (progressive migration from bcrypt)
      const hashedCode = await hashBackupCode(code);
      hashedCodes.push(hashedCode);
    }

    return { plaintextCodes, hashedCodes };
  }

  /**
   * Valide un code de backup contre les codes hashés
   * SEC-07: Comparaison sécurisée avec bcrypt
   */
  async validateBackupCode(hashedCodes: string[], code: string): Promise<{
    isValid: boolean;
    matchedIndex: number | null;
  }> {
    const normalizedCode = code.toUpperCase().trim();

    for (let i = 0; i < hashedCodes.length; i++) {
      const hashedCode = hashedCodes[i];
      
      // Support legacy plaintext codes (migration)
      if (hashedCode === normalizedCode) {
        this.logger.warn('Legacy plaintext backup code detected - consider migrating');
        return { isValid: true, matchedIndex: i };
      }

      // Verify against hash (supports both bcrypt legacy and Argon2id)
      try {
        const isMatch = await verifyBackupCode(normalizedCode, hashedCode);
        if (isMatch) {
          return { isValid: true, matchedIndex: i };
        }
      } catch {
        // Continue to next code if comparison fails
      }
    }

    return { isValid: false, matchedIndex: null };
  }
}
