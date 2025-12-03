/**
 * Tests Security Configuration
 * Audit sécurité : tests des fonctions de sécurité
 */

import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  redactSensitiveData,
  generateSecureToken,
  sanitizeInput,
  isAllowedFileType,
  securityConfig,
} from '@/lib/security/config';

describe('Security Configuration', () => {
  describe('validatePassword', () => {
    it('should reject passwords shorter than minimum length', () => {
      const result = validatePassword('Short1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`Password must be at least ${securityConfig.password.minLength} characters`);
    });

    it('should reject passwords without uppercase when required', () => {
      const result = validatePassword('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
    });

    it('should reject passwords without lowercase when required', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
    });

    it('should reject passwords without numbers when required', () => {
      const result = validatePassword('NoNumbers');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('number'))).toBe(true);
    });

    it('should reject common passwords', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('common'))).toBe(true);
    });

    it('should accept valid passwords', () => {
      const result = validatePassword('SecurePass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept password at minimum length', () => {
      const result = validatePassword('Abcd1234');
      expect(result.valid).toBe(true);
    });
  });

  describe('redactSensitiveData', () => {
    it('should redact password fields', () => {
      const data = { username: 'test', password: 'secret123' };
      const result = redactSensitiveData(data) as Record<string, unknown>;
      expect(result.username).toBe('test');
      expect(result.password).toBe('[REDACTED]');
    });

    it('should redact api_key fields', () => {
      const data = { api_key: 'sk_test_xxx' };
      const result = redactSensitiveData(data) as Record<string, unknown>;
      expect(result.api_key).toBe('[REDACTED]');
    });

    it('should redact token fields', () => {
      const data = { access_token: 'jwt_xxx' };
      const result = redactSensitiveData(data) as Record<string, unknown>;
      expect(result.access_token).toBe('[REDACTED]');
    });

    it('should redact credit card numbers in strings', () => {
      const result = redactSensitiveData('Card: 4111-1111-1111-1111');
      expect(result).toBe('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          email: 'test@example.com',
          password: 'secret',
        },
      };
      const result = redactSensitiveData(data) as Record<string, any>;
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.password).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const data = [{ password: 'secret1' }, { password: 'secret2' }];
      const result = redactSensitiveData(data) as Array<Record<string, unknown>>;
      expect(result[0].password).toBe('[REDACTED]');
      expect(result[1].password).toBe('[REDACTED]');
    });

    it('should return null/undefined as is', () => {
      expect(redactSensitiveData(null)).toBeNull();
      expect(redactSensitiveData(undefined)).toBeUndefined();
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = generateSecureToken(32);
      expect(token).toHaveLength(32);
    });

    it('should generate different tokens each time', () => {
      const token1 = generateSecureToken(32);
      const token2 = generateSecureToken(32);
      expect(token1).not.toBe(token2);
    });

    it('should only contain alphanumeric characters', () => {
      const token = generateSecureToken(100);
      expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
    });

    it('should use default length of 32', () => {
      const token = generateSecureToken();
      expect(token).toHaveLength(32);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove angle brackets', () => {
      const result = sanitizeInput('<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove javascript: protocol', () => {
      const result = sanitizeInput('javascript:alert("xss")');
      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const result = sanitizeInput('onclick=alert("xss")');
      expect(result.toLowerCase()).not.toContain('onclick=');
    });

    it('should trim whitespace', () => {
      const result = sanitizeInput('  test input  ');
      expect(result).toBe('test input');
    });

    it('should preserve normal text', () => {
      const result = sanitizeInput('Hello World!');
      expect(result).toBe('Hello World!');
    });
  });

  describe('isAllowedFileType', () => {
    it('should allow JPEG images', () => {
      expect(isAllowedFileType('image/jpeg', 'photo.jpg')).toBe(true);
      expect(isAllowedFileType('image/jpeg', 'photo.jpeg')).toBe(true);
    });

    it('should allow PNG images', () => {
      expect(isAllowedFileType('image/png', 'image.png')).toBe(true);
    });

    it('should allow WebP images', () => {
      expect(isAllowedFileType('image/webp', 'image.webp')).toBe(true);
    });

    it('should allow SVG images', () => {
      expect(isAllowedFileType('image/svg+xml', 'icon.svg')).toBe(true);
    });

    it('should allow PDF files', () => {
      expect(isAllowedFileType('application/pdf', 'document.pdf')).toBe(true);
    });

    it('should reject executable files', () => {
      expect(isAllowedFileType('application/x-executable', 'malware.exe')).toBe(false);
    });

    it('should reject scripts', () => {
      expect(isAllowedFileType('application/javascript', 'script.js')).toBe(false);
    });

    it('should reject mismatched mime type and extension', () => {
      // File claims to be JPEG but has .exe extension
      expect(isAllowedFileType('image/jpeg', 'fake.exe')).toBe(false);
    });
  });
});

describe('Security Config Values', () => {
  it('should have reasonable session max age', () => {
    expect(securityConfig.session.maxAge).toBeGreaterThanOrEqual(24 * 60 * 60); // At least 1 day
    expect(securityConfig.session.maxAge).toBeLessThanOrEqual(30 * 24 * 60 * 60); // At most 30 days
  });

  it('should have reasonable rate limits', () => {
    expect(securityConfig.rateLimit.login.maxAttempts).toBeLessThanOrEqual(10);
    expect(securityConfig.rateLimit.api.maxRequests).toBeGreaterThanOrEqual(50);
  });

  it('should have reasonable file upload limits', () => {
    expect(securityConfig.upload.maxFileSize).toBeLessThanOrEqual(50 * 1024 * 1024); // Max 50MB
    expect(securityConfig.upload.maxFileSize).toBeGreaterThanOrEqual(1024 * 1024); // Min 1MB
  });

  it('should have 2FA configured correctly', () => {
    expect(securityConfig.twoFactor.digits).toBe(6);
    expect(securityConfig.twoFactor.period).toBe(30);
    expect(securityConfig.twoFactor.backupCodesCount).toBeGreaterThanOrEqual(5);
  });
});

