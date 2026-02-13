import { Injectable, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Service de chiffrement AES-256-GCM pour les données sensibles
 * SEC-05: Chiffrement des tokens OAuth et credentials
 * SEC-06: Chiffrement des credentials Shopify/WooCommerce
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private encryptionKey: Buffer | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeKey();
  }

  /**
   * Initialise la clé de chiffrement depuis les variables d'environnement
   */
  private initializeKey(): void {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';

      if (!keyHex) {
      if (nodeEnv === 'production') {
        this.logger.error('ENCRYPTION_KEY is required in production');
        throw new InternalServerErrorException('ENCRYPTION_KEY environment variable is required');
      }
      // In development, derive key from JWT_SECRET (no fallback - must be configured)
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new InternalServerErrorException(
          'JWT_SECRET must be configured when ENCRYPTION_KEY is not set (required for encryption service)',
        );
      }
      this.encryptionKey = crypto.scryptSync(jwtSecret, 'luneo-salt', this.keyLength);
      this.logger.warn('Using derived encryption key for development - set ENCRYPTION_KEY for production');
      return;
    }

    // Valider et parser la clé hexadécimale
    if (keyHex.length !== 64) {
      throw new BadRequestException('ENCRYPTION_KEY must be 64 hex characters (256 bits)');
    }

    try {
      this.encryptionKey = Buffer.from(keyHex, 'hex');
    } catch (error) {
      throw new BadRequestException('ENCRYPTION_KEY must be a valid hex string');
    }

    this.logger.log('Encryption service initialized with secure key');
  }

  /**
   * Chiffre une chaîne de caractères
   * @param plaintext - Texte en clair à chiffrer
   * @returns Texte chiffré au format: iv:tag:ciphertext (base64)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    if (!this.encryptionKey) {
      throw new InternalServerErrorException('Encryption key not initialized');
    }

    try {
      // Générer un IV aléatoire pour chaque chiffrement
      const iv = crypto.randomBytes(this.ivLength);

      // Créer le cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Chiffrer
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      // Récupérer le tag d'authentification
      const tag = cipher.getAuthTag();

      // Concaténer iv + tag + ciphertext et encoder en base64
      const combined = Buffer.concat([iv, tag, encrypted]);
      return combined.toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new InternalServerErrorException('Failed to encrypt data');
    }
  }

  /**
   * Déchiffre une chaîne de caractères
   * @param ciphertext - Texte chiffré au format: base64(iv + tag + ciphertext)
   * @returns Texte en clair
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      return '';
    }

    if (!this.encryptionKey) {
      throw new InternalServerErrorException('Encryption key not initialized');
    }

    try {
      // Décoder le base64
      const combined = Buffer.from(ciphertext, 'base64');

      // Extraire iv, tag et données chiffrées
      const iv = combined.subarray(0, this.ivLength);
      const tag = combined.subarray(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.subarray(this.ivLength + this.tagLength);

      // Créer le decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(tag);

      // Déchiffrer
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Decryption failed - data may be corrupted or tampered with', error);
      throw new InternalServerErrorException('Failed to decrypt data');
    }
  }

  /**
   * Vérifie si une chaîne semble être chiffrée avec ce service
   * Utile pour la migration de données existantes
   */
  isEncrypted(data: string): boolean {
    if (!data) return false;

    try {
      const combined = Buffer.from(data, 'base64');
      // Vérifier que la longueur minimale est correcte (iv + tag + au moins 1 byte)
      return combined.length >= this.ivLength + this.tagLength + 1;
    } catch {
      return false;
    }
  }

  /**
   * Migre une donnée de Base64 simple vers le chiffrement AES-256-GCM
   * Utile pour la migration des données existantes
   */
  migrateFromBase64(base64Data: string): string {
    try {
      // Décoder le Base64 pour obtenir le texte en clair
      const plaintext = Buffer.from(base64Data, 'base64').toString('utf8');
      // Chiffrer avec AES-256-GCM
      return this.encrypt(plaintext);
    } catch (error) {
      this.logger.error('Migration from Base64 failed', error);
      throw new InternalServerErrorException('Failed to migrate data from Base64');
    }
  }

  /**
   * Génère une nouvelle clé de chiffrement (pour la configuration initiale)
   * @returns Clé hexadécimale de 64 caractères
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
