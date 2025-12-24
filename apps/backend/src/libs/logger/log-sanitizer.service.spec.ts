/**
 * LogSanitizerService - Tests unitaires
 * Tests pour la sanitization des logs
 */

import { LogSanitizerService } from './log-sanitizer.service';

describe('LogSanitizerService', () => {
  let service: LogSanitizerService;

  beforeEach(() => {
    service = new LogSanitizerService();
  });

  describe('sanitize', () => {
    it('should mask passwords completely', () => {
      const input = 'User login with password: MySecret123!';
      const result = service.sanitize(input);

      expect(result).toContain('********');
      expect(result).not.toContain('MySecret123!');
    });

    it('should mask API keys partially', () => {
      const input = 'API call with api_key: sk_live_1234567890abcdef';
      const result = service.sanitize(input);

      expect(result).toContain('sk_l');
      expect(result).toContain('cdef');
      expect(result).not.toContain('1234567890abcdef');
    });

    it('should mask tokens partially', () => {
      const input = 'Request with token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      const result = service.sanitize(input);

      expect(result).toContain('eyJh');
      expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should mask database passwords in URLs', () => {
      const input = 'Connecting to postgresql://user:password123@localhost:5432/db';
      const result = service.sanitize(input);

      expect(result).toContain('********');
      expect(result).not.toContain('password123');
    });

    it('should sanitize objects recursively', () => {
      const input = {
        user: {
          email: 'user@example.com',
          password: 'secret123',
        },
        apiKey: 'sk_live_1234567890',
      };

      const result = service.sanitizeObject(input);

      expect(result.user.password).toBe('********');
      expect(result.apiKey).toContain('sk_l');
      expect(result.apiKey).not.toContain('1234567890');
    });

    it('should handle arrays', () => {
      const input = [
        { password: 'secret1' },
        { password: 'secret2' },
      ];

      const result = service.sanitize(JSON.stringify(input));
      const parsed = JSON.parse(result);

      expect(parsed[0].password).toBe('********');
      expect(parsed[1].password).toBe('********');
    });

    it('should handle null and undefined', () => {
      expect(service.sanitize(null as any)).toBe('null');
      expect(service.sanitize(undefined as any)).toBe('undefined');
    });

    it('should mask secrets completely', () => {
      const input = 'Config with secret: my_secret_key_12345';
      const result = service.sanitize(input);

      expect(result).toContain('********');
      expect(result).not.toContain('my_secret_key_12345');
    });

    it('should mask JWT secrets completely', () => {
      const input = 'JWT secret: my_jwt_secret_key_abcdef';
      const result = service.sanitize(input);

      expect(result).toContain('********');
      expect(result).not.toContain('my_jwt_secret_key_abcdef');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const input = {
        level1: {
          level2: {
            password: 'secret',
            apiKey: 'sk_live_1234567890',
          },
        },
      };

      const result = service.sanitizeObject(input);

      expect(result.level1.level2.password).toBe('********');
      expect(result.level1.level2.apiKey).toContain('sk_l');
    });

    it('should preserve non-sensitive data', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const result = service.sanitizeObject(input);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.age).toBe(30);
    });
  });
});

