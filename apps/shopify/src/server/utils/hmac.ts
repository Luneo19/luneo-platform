import * as crypto from 'crypto';

export class HmacUtils {
  /**
   * Générer un HMAC SHA256
   */
  static generateHmac(data: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(data, 'utf8')
      .digest('hex');
  }

  /**
   * Générer un HMAC SHA256 en base64
   */
  static generateHmacBase64(data: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(data, 'utf8')
      .digest('base64');
  }

  /**
   * Valider un HMAC
   */
  static validateHmac(data: string, hmac: string, secret: string): boolean {
    const calculatedHmac = this.generateHmac(data, secret);
    return calculatedHmac === hmac;
  }

  /**
   * Valider un HMAC base64
   */
  static validateHmacBase64(data: string, hmac: string, secret: string): boolean {
    const calculatedHmac = this.generateHmacBase64(data, secret);
    return calculatedHmac === hmac;
  }

  /**
   * Générer un hash sécurisé pour les webhooks
   */
  static generateWebhookHash(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');
  }

  /**
   * Valider un hash de webhook
   */
  static validateWebhookHash(payload: string, hash: string, secret: string): boolean {
    const calculatedHash = this.generateWebhookHash(payload, secret);
    return calculatedHash === hash;
  }

  /**
   * Générer un nonce sécurisé
   */
  static generateNonce(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Générer un state CSRF sécurisé
   */
  static generateCSRFState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hasher un mot de passe
   */
  static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .createHmac('sha256', usedSalt)
      .update(password, 'utf8')
      .digest('hex');
    
    return { hash, salt: usedSalt };
  }

  /**
   * Vérifier un mot de passe
   */
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: calculatedHash } = this.hashPassword(password, salt);
    return calculatedHash === hash;
  }

  /**
   * Générer une clé API sécurisée
   */
  static generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Générer un token de session sécurisé
   */
  static generateSessionToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  /**
   * Chiffrer des données sensibles
   */
  static encrypt(data: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Déchiffrer des données sensibles
   */
  static decrypt(encryptedData: string, key: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Générer une signature pour les requêtes API
   */
  static generateApiSignature(method: string, url: string, body: string, secret: string): string {
    const data = `${method.toUpperCase()}${url}${body}`;
    return this.generateHmac(data, secret);
  }

  /**
   * Valider une signature d'API
   */
  static validateApiSignature(
    method: string,
    url: string,
    body: string,
    signature: string,
    secret: string
  ): boolean {
    const calculatedSignature = this.generateApiSignature(method, url, body, secret);
    return calculatedSignature === signature;
  }
}



