import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 64;
  private readonly keyLength = 32;
  private readonly iterations = 100000;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get master encryption key from environment
   */
  private getMasterKey(): Buffer {
    const masterKey = this.configService.get<string>('MASTER_ENCRYPTION_KEY');
    
    if (!masterKey) {
      throw new Error('MASTER_ENCRYPTION_KEY not configured');
    }

    if (masterKey.length !== 64) {
      throw new Error('MASTER_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    return Buffer.from(masterKey, 'hex');
  }

  /**
   * Derive encryption key from master key and salt
   */
  private deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(masterKey, salt, this.iterations, this.keyLength, 'sha256');
  }

  /**
   * Encrypt sensitive data
   * Returns base64 string containing: salt + iv + authTag + encrypted data
   */
  encrypt(plaintext: string): string {
    try {
      const masterKey = this.getMasterKey();
      
      // Generate unique salt for this operation
      const salt = crypto.randomBytes(this.saltLength);
      
      // Derive encryption key
      const key = this.deriveKey(masterKey, salt);
      
      // Generate unique IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag (GCM)
      const authTag = cipher.getAuthTag();
      
      // Combine: salt + iv + authTag + encrypted
      const combined = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]);
      
      // Return as base64
      return combined.toString('base64');
      
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data
   * Expects base64 string containing: salt + iv + authTag + encrypted data
   */
  decrypt(encryptedData: string): string {
    try {
      const masterKey = this.getMasterKey();
      
      // Decode base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(this.saltLength, this.saltLength + this.ivLength);
      const authTag = combined.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = combined.subarray(this.saltLength + this.ivLength + this.tagLength);
      
      // Derive decryption key
      const key = this.deriveKey(masterKey, salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
      
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
