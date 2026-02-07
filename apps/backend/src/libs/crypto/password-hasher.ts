/**
 * @fileoverview Unified password hashing utility.
 *
 * Implements progressive migration from bcrypt to Argon2id (OWASP 2025).
 *
 * STRATEGY (lazy rehash):
 * - New passwords are always hashed with Argon2id.
 * - On login, if the stored hash is bcrypt, verify with bcrypt then re-hash with Argon2id.
 * - Bcrypt hashes start with "$2a$" or "$2b$".
 * - Argon2id hashes start with "$argon2id$".
 *
 * ARGON2ID PARAMETERS (OWASP 2025):
 * - memoryCost: 65536 (64 MB)
 * - timeCost: 3
 * - parallelism: 4
 * - type: argon2id (default in argon2 package)
 */

import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ARGON2_OPTIONS: argon2.Options = {
  memoryCost: 65_536, // 64 MB
  timeCost: 3,
  parallelism: 4,
  type: argon2.argon2id,
};

/** bcrypt hashes start with $2a$ or $2b$ */
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$');
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Hash a password using Argon2id.
 * All new passwords (signup, reset) should use this function.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against a hash (bcrypt or Argon2id).
 * Returns an object indicating if the password is valid AND if the hash needs migration.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (isBcryptHash(storedHash)) {
    const isValid = await bcrypt.compare(password, storedHash);
    return { isValid, needsRehash: isValid }; // rehash only if valid (no point otherwise)
  }

  // Argon2id verification
  const isValid = await argon2.verify(storedHash, password);
  // Check if argon2 recommends rehash (e.g. if params changed)
  const needsRehash = isValid && argon2.needsRehash(storedHash, ARGON2_OPTIONS);
  return { isValid, needsRehash };
}

/**
 * Hash a backup code using Argon2id (lighter params for non-password secrets).
 * Backup codes are 8 chars, lower entropy than passwords, so we can use lighter params.
 */
export async function hashBackupCode(code: string): Promise<string> {
  return argon2.hash(code, {
    ...ARGON2_OPTIONS,
    memoryCost: 16_384, // 16 MB (lighter for backup codes)
    timeCost: 2,
  });
}

/**
 * Verify a backup code against a hash (bcrypt or Argon2id).
 */
export async function verifyBackupCode(
  code: string,
  storedHash: string,
): Promise<boolean> {
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(code, storedHash);
  }
  return argon2.verify(storedHash, code);
}
