/**
 * ★★★ SERVICE - 2FA / MFA ★★★
 * Service client pour l'authentification à deux facteurs
 * Utilise l'API backend pour toutes les opérations sensibles
 * - TOTP (Time-based One-Time Password)
 * - Backup codes
 */

import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  code: string;
  method: 'totp' | 'sms' | 'email';
}

export interface TwoFactorStatus {
  enabled: boolean;
  hasBackupCodes: boolean;
}

// ========================================
// SERVICE
// ========================================

export class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;

  private constructor() {}

  static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  // ========================================
  // SETUP (via Backend API)
  // ========================================

  /**
   * Initialise la 2FA pour l'utilisateur connecté
   * Appelle l'API backend qui gère la génération et le stockage sécurisé
   */
  async setup(): Promise<TwoFactorSetup> {
    try {
      logger.info('Setting up 2FA via API');

      const response = await endpoints.auth.setup2FA();

      if (!response.data) {
        throw new Error('Failed to setup 2FA');
      }

      const setup: TwoFactorSetup = {
        secret: response.data.secret,
        qrCode: response.data.qrCodeUrl,
        backupCodes: response.data.backupCodes,
      };

      logger.info('2FA setup completed');

      return setup;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error setting up 2FA', { error: errorMessage });
      throw error;
    }
  }

  /**
   * @deprecated Use setup() instead - no userId needed, uses authenticated user
   */
  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const setup = await this.setup();
    return {
      secret: setup.secret,
      qrCode: setup.qrCode,
    };
  }

  // ========================================
  // VERIFICATION (via Backend API)
  // ========================================

  /**
   * Vérifie et active la 2FA avec un code TOTP
   * Appelle l'API backend pour la vérification sécurisée
   */
  async verify2FA(token: string): Promise<{ success: boolean; backupCodes?: string[] }> {
    try {
      logger.info('Verifying 2FA via API');

      const response = await endpoints.auth.verify2FA({ token });

      if (!response.data) {
        return { success: false };
      }

      logger.info('2FA verified successfully');

      return {
        success: true,
        backupCodes: response.data.backupCodes,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error verifying 2FA', { error: errorMessage });
      return { success: false };
    }
  }

  /**
   * @deprecated Use verify2FA() instead
   */
  async verifyCode(
    userId: string,
    code: string,
    method: 'totp' | 'backup' = 'totp'
  ): Promise<boolean> {
    const result = await this.verify2FA(code);
    return result.success;
  }

  /**
   * @deprecated Use verify2FA() instead
   */
  async verify(
    userId: string,
    verification: TwoFactorVerification
  ): Promise<boolean> {
    if (verification.method === 'totp') {
      const result = await this.verify2FA(verification.code);
      return result.success;
    }
    // SMS/Email not supported in current backend implementation
    logger.warn('SMS/Email 2FA methods not supported');
    return false;
  }

  // ========================================
  // ENABLE / DISABLE (via Backend API)
  // ========================================

  /**
   * Active la 2FA avec un code de vérification
   */
  async enable(verificationCode: string): Promise<{ backupCodes: string[] }> {
    try {
      logger.info('Enabling 2FA via API');

      const result = await this.verify2FA(verificationCode);

      if (!result.success) {
        throw new Error('Invalid verification code');
      }

      logger.info('2FA enabled successfully');

      return {
        backupCodes: result.backupCodes || [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error enabling 2FA', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Désactive la 2FA via l'API backend
   */
  async disable(): Promise<void> {
    try {
      logger.info('Disabling 2FA via API');

      await endpoints.auth.disable2FA();

      logger.info('2FA disabled successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error disabling 2FA', { error: errorMessage });
      throw error;
    }
  }

  // ========================================
  // STATUS
  // ========================================

  /**
   * Vérifie si la 2FA est activée pour l'utilisateur connecté
   */
  async getStatus(): Promise<TwoFactorStatus> {
    try {
      const response = await endpoints.auth.me();
      
      if (!response.data) {
        return { enabled: false, hasBackupCodes: false };
      }

      return {
        enabled: response.data.is2FAEnabled || false,
        hasBackupCodes: (response.data.backupCodesCount || 0) > 0,
      };
    } catch (error) {
      logger.error('Error getting 2FA status', { error });
      return { enabled: false, hasBackupCodes: false };
    }
  }

  /**
   * @deprecated Use getStatus() instead
   */
  async isEnabled(userId: string): Promise<boolean> {
    const status = await this.getStatus();
    return status.enabled;
  }

  // ========================================
  // BACKUP CODES (Note: Régénération via nouveau setup requis)
  // ========================================

  /**
   * @deprecated Pour régénérer les codes de backup, désactivez et réactivez la 2FA
   */
  async generateBackupCodes(): Promise<string[]> {
    logger.warn('generateBackupCodes is deprecated. Re-setup 2FA to get new backup codes.');
    // Les codes de backup sont générés lors du setup initial
    // Pour en obtenir de nouveaux, il faut refaire le setup 2FA
    throw new Error('To regenerate backup codes, please disable and re-enable 2FA');
  }
}

// ========================================
// EXPORT
// ========================================

export const twoFactorAuth = TwoFactorAuthService.getInstance();
