/**
 * ★★★ SERVICE - 2FA / MFA ★★★
 * Service professionnel pour l'authentification à deux facteurs
 * - TOTP (Time-based One-Time Password)
 * - SMS codes
 * - Email codes
 * - Backup codes
 */

import { cacheService } from '@/lib/cache/CacheService';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
// @ts-expect-error - bcryptjs types may not be available
import bcrypt from 'bcryptjs';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';

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
  // SETUP
  // ========================================

  /**
   * Génère un secret TOTP
   */
  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    try {
      logger.info('Generating TOTP secret', { userId });

      // Get user email for QR code label
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `Luneo (${user.email})`,
        issuer: 'Luneo',
        length: 32,
      });

      // Generate QR code
      const qrCode = await qrcode.toDataURL(secret.otpauth_url || '');

      // Save secret to database (not enabled yet)
      // Note: In production, use totp_secrets table from Supabase
      // For now, store in User model if it has twoFactorSecret field
      const backupCodes = this.generateBackupCodesInternal(10);

      logger.info('TOTP secret generated', { userId });

      return {
        secret: secret.base32 || '',
        qrCode,
      };
    } catch (error: any) {
      logger.error('Error generating TOTP secret', { error, userId });
      throw error;
    }
  }

  /**
   * Initialise la 2FA pour un utilisateur
   */
  async setup(userId: string): Promise<TwoFactorSetup> {
    try {
      logger.info('Setting up 2FA', { userId });

      const { secret, qrCode } = await this.generateSecret(userId);
      const backupCodes = this.generateBackupCodesInternal(10);

      // Save to database (in production, use totp_secrets table)
      // For now, we'll use cache or a placeholder
      cacheService.set(`2fa:setup:${userId}`, {
        secret,
        backupCodes,
        enabled: false,
      }, { ttl: 3600 * 1000 }); // 1 hour to complete setup

      const setup: TwoFactorSetup = {
        secret,
        qrCode,
        backupCodes,
      };

      logger.info('2FA setup completed', { userId });

      return setup;
    } catch (error: any) {
      logger.error('Error setting up 2FA', { error, userId });
      throw error;
    }
  }

  // ========================================
  // VERIFICATION
  // ========================================

  /**
   * Vérifie un code 2FA
   */
  async verifyCode(
    userId: string,
    code: string,
    method: 'totp' | 'backup' = 'totp'
  ): Promise<boolean> {
    try {
      // Get 2FA setup from cache or database
      const setup = cacheService.get<{ secret: string; backupCodes: string[] }>(`2fa:setup:${userId}`);
      
      // In production, query from totp_secrets table
      // const totpSecret = await db.totpSecret.findUnique({ where: { userId } });

      if (!setup) {
        throw new Error('2FA not set up');
      }

      if (method === 'totp') {
        // Verify TOTP code
        const isValid = speakeasy.totp.verify({
          secret: setup.secret,
          encoding: 'base32',
          token: code,
          window: 2, // Allow 2 time periods (60 seconds)
        });

        return isValid ?? false;
      } else if (method === 'backup') {
        // Verify backup code
        const isValid = setup.backupCodes.includes(code);
        
        if (isValid) {
          // Remove used backup code
          const updatedCodes = setup.backupCodes.filter((c) => c !== code);
          cacheService.set(`2fa:setup:${userId}`, {
            ...setup,
            backupCodes: updatedCodes,
          }, { ttl: 3600 * 1000 });
        }

        return isValid;
      }

      return false;
    } catch (error: any) {
      logger.error('Error verifying 2FA code', { error, userId });
      throw error;
    }
  }

  /**
   * Vérifie un code 2FA (legacy method for compatibility)
   */
  async verify(
    userId: string,
    verification: TwoFactorVerification
  ): Promise<boolean> {
    if (verification.method === 'totp') {
      return await this.verifyCode(userId, verification.code, 'totp');
    } else if (verification.method === 'sms' || verification.method === 'email') {
      // Verify from cache
      const cached = cacheService.get<string>(`2fa:${userId}:${verification.method}`);
      return cached === verification.code;
    }
    return false;
  }

  // ========================================
  // ENABLE / DISABLE
  // ========================================

  /**
   * Active la 2FA
   */
  async enable(userId: string, verificationCode: string): Promise<void> {
    try {
      logger.info('Enabling 2FA', { userId });

      // Verify code first
      const isValid = await this.verifyCode(userId, verificationCode, 'totp');
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Get setup data
      const setup = cacheService.get<{ secret: string; backupCodes: string[] }>(`2fa:setup:${userId}`);
      if (!setup) {
        throw new Error('2FA setup not found');
      }

      // Enable in database (in production, use totp_secrets table)
      // await db.totpSecret.update({
      //   where: { userId },
      //   data: {
      //     enabled: true,
      //     verifiedAt: new Date(),
      //   },
      // });

      // Mark as enabled in cache
      cacheService.set(`2fa:enabled:${userId}`, true, 86400 * 365); // 1 year

      logger.info('2FA enabled', { userId });
    } catch (error: any) {
      logger.error('Error enabling 2FA', { error, userId });
      throw error;
    }
  }

  /**
   * Désactive la 2FA
   */
  async disable(userId: string, password: string): Promise<void> {
    try {
      logger.info('Disabling 2FA', { userId });

      // Verify password
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user?.password) {
        throw new Error('User not found or has no password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Disable in database (in production, use totp_secrets table)
      // await db.totpSecret.delete({
      //   where: { userId },
      // });

      // Remove from cache
      cacheService.delete(`2fa:enabled:${userId}`);
      cacheService.delete(`2fa:setup:${userId}`);

      logger.info('2FA disabled', { userId });
    } catch (error: any) {
      logger.error('Error disabling 2FA', { error, userId });
      throw error;
    }
  }

  // ========================================
  // BACKUP CODES
  // ========================================

  /**
   * Génère de nouveaux codes de backup
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    try {
      logger.info('Generating backup codes', { userId });

      // Generate new codes
      const backupCodes = this.generateBackupCodesInternal(10);

      // Update in database (in production, use totp_secrets table)
      // await db.totpSecret.update({
      //   where: { userId },
      //   data: { backupCodes },
      // });

      // Update in cache
      const setup = cacheService.get<{ secret: string; backupCodes: string[] }>(`2fa:setup:${userId}`);
      if (setup) {
        cacheService.set(`2fa:setup:${userId}`, {
          ...setup,
          backupCodes,
        }, 3600);
      }

      logger.info('Backup codes generated', { userId });

      return backupCodes;
    } catch (error: any) {
      logger.error('Error generating backup codes', { error, userId });
      throw error;
    }
  }

  // ========================================
  // UTILS
  // ========================================

  /**
   * Génère des codes de backup
   */
  private generateBackupCodesInternal(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}

// ========================================
// EXPORT
// ========================================

export const twoFactorAuth = TwoFactorAuthService.getInstance();

