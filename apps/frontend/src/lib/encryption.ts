/**
 * ENCRYPTION UTILITY
 * Chiffrement AES-256-GCM pour credentials sensibles
 * Utilise la MASTER_ENCRYPTION_KEY depuis les env variables
 */

import crypto from 'crypto';
import { logger } from './logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Pour GCM
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Obtenir la master key depuis les variables d'environnement
 * Cette clé doit être une chaîne hexadécimale de 64 caractères (32 bytes)
 */
function getMasterKey(): Buffer {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  
  if (!masterKey) {
    throw new Error('MASTER_ENCRYPTION_KEY non configurée');
  }

  if (masterKey.length !== 64) {
    throw new Error('MASTER_ENCRYPTION_KEY doit faire 64 caractères hexadécimaux');
  }

  return Buffer.from(masterKey, 'hex');
}

/**
 * Dériver une clé de chiffrement depuis la master key et un salt
 */
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Chiffrer des données sensibles
 * Retourne une chaîne base64 contenant: salt + iv + authTag + encrypted data
 */
export function encrypt(plaintext: string): string {
  try {
    const masterKey = getMasterKey();
    
    // Générer un salt unique pour cette opération
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Dériver une clé de chiffrement
    const key = deriveKey(masterKey, salt);
    
    // Générer un IV (Initialization Vector) unique
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Créer le cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Chiffrer
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Obtenir le tag d'authentification (GCM)
    const authTag = cipher.getAuthTag();
    
    // Combiner: salt + iv + authTag + encrypted
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    // Retourner en base64
    return combined.toString('base64');
    
  } catch (error) {
    logger.error('Erreur chiffrement', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Échec du chiffrement');
  }
}

/**
 * Déchiffrer des données
 * Attend une chaîne base64 contenant: salt + iv + authTag + encrypted data
 */
export function decrypt(encryptedData: string): string {
  try {
    const masterKey = getMasterKey();
    
    // Décoder depuis base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extraire les composants
    let offset = 0;
    
    const salt = combined.subarray(offset, offset + SALT_LENGTH);
    offset += SALT_LENGTH;
    
    const iv = combined.subarray(offset, offset + IV_LENGTH);
    offset += IV_LENGTH;
    
    const authTag = combined.subarray(offset, offset + TAG_LENGTH);
    offset += TAG_LENGTH;
    
    const encrypted = combined.subarray(offset);
    
    // Dériver la clé de chiffrement
    const key = deriveKey(masterKey, salt);
    
    // Créer le decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Déchiffrer
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error) {
    logger.error('Erreur déchiffrement', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Échec du déchiffrement');
  }
}

/**
 * Hacher une chaîne (pour comparer des secrets sans les stocker en clair)
 * Utilise PBKDF2 avec un salt
 */
export function hash(plaintext: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hashed = crypto.pbkdf2Sync(plaintext, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  
  // Combiner salt + hash
  const combined = Buffer.concat([salt, hashed]);
  return combined.toString('base64');
}

/**
 * Vérifier si un plaintext correspond à un hash
 */
export function verifyHash(plaintext: string, hashedData: string): boolean {
  try {
    const combined = Buffer.from(hashedData, 'base64');
    
    const salt = combined.subarray(0, SALT_LENGTH);
    const storedHash = combined.subarray(SALT_LENGTH);
    
    const computedHash = crypto.pbkdf2Sync(plaintext, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    
    return crypto.timingSafeEqual(storedHash, computedHash);
  } catch (error) {
    return false;
  }
}

/**
 * Générer une clé aléatoire sécurisée
 * Utile pour générer des API keys, tokens, etc.
 */
export function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Générer une master encryption key (à faire une seule fois)
 * À stocker dans MASTER_ENCRYPTION_KEY
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Masquer partiellement une clé pour l'affichage
 * Ex: "sk_live_abc123def456" → "sk_live_abc...def456"
 */
export function maskKey(key: string, showFirst: number = 8, showLast: number = 4): string {
  if (key.length <= showFirst + showLast) {
    return key;
  }
  
  const first = key.substring(0, showFirst);
  const last = key.substring(key.length - showLast);
  
  return `${first}...${last}`;
}

/**
 * Vérifier la force d'un mot de passe
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-4
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Longueur
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  else feedback.push('Utilisez au moins 12 caractères');

  // Complexité
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Utilisez des majuscules ET des minuscules');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Ajoutez des chiffres');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Ajoutez des caractères spéciaux (!@#$%^&*)');

  // Patterns courants (réduire le score)
  if (/^[0-9]+$/.test(password)) score = Math.max(0, score - 2);
  if (/^[a-zA-Z]+$/.test(password)) score = Math.max(0, score - 1);
  if (/password|123456|qwerty/i.test(password)) score = 0;

  return {
    score: Math.min(4, score),
    feedback
  };
}

/**
 * Client-side encryption (pour données sensibles côté client)
 * Utilise Web Crypto API
 */
export const clientEncryption = {
  /**
   * Générer une clé de chiffrement côté client
   */
  async generateKey(): Promise<CryptoKey> {
    if (typeof window === 'undefined') {
      throw new Error('clientEncryption disponible uniquement côté client');
    }

    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Chiffrer côté client
   */
  async encrypt(plaintext: string, key: CryptoKey): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('clientEncryption disponible uniquement côté client');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );

    // Combiner iv + encrypted
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convertir en base64
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  },

  /**
   * Déchiffrer côté client
   */
  async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('clientEncryption disponible uniquement côté client');
    }

    // Décoder base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extraire iv et encrypted
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
};

