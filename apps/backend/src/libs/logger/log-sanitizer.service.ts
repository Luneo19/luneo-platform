/**
 * Log Sanitizer Service
 * Automatically masks sensitive information in logs
 * 
 * SEC-10: Protection des PII (Personally Identifiable Information)
 */

import { Injectable, Logger } from '@nestjs/common';

export interface SanitizeOptions {
  /**
   * Whether to mask the entire value or show partial
   */
  maskFull?: boolean;
  
  /**
   * Number of characters to show at the start (if not maskFull)
   */
  showStart?: number;
  
  /**
   * Number of characters to show at the end (if not maskFull)
   */
  showEnd?: number;
  
  /**
   * Replacement string for masked parts
   */
  maskChar?: string;
  
  /**
   * SEC-10: For emails - keep the domain part visible
   */
  keepDomain?: boolean;
}

@Injectable()
export class LogSanitizerService {
  private readonly logger = new Logger(LogSanitizerService.name);
  
  // Patterns for detecting sensitive data
  private readonly sensitivePatterns: Array<{
    pattern: RegExp;
    name: string;
    options?: SanitizeOptions;
  }> = [
    // SEC-10: Email addresses (PII)
    {
      pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      name: 'email',
      options: { showStart: 2, showEnd: 0, keepDomain: true },
    },
    
    // SEC-10: Phone numbers (PII) - formats variés
    {
      pattern: /(?:\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
      name: 'phone',
      options: { showStart: 0, showEnd: 4 },
    },
    
    // SEC-10: IP addresses
    {
      pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      name: 'ip_address',
      options: { showStart: 0, showEnd: 0 },
    },
    
    // Passwords
    {
      pattern: /(?:password|passwd|pwd)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'password',
      options: { maskFull: true },
    },
    {
      pattern: /"password"\s*:\s*"([^"]+)"/gi,
      name: 'password',
      options: { maskFull: true },
    },
    
    // API Keys
    {
      pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'api_key',
      options: { showStart: 4, showEnd: 4 },
    },
    {
      pattern: /"api[_-]?key"\s*:\s*"([^"]+)"/gi,
      name: 'api_key',
      options: { showStart: 4, showEnd: 4 },
    },
    
    // Tokens
    {
      pattern: /(?:token|access[_-]?token|refresh[_-]?token)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'token',
      options: { showStart: 4, showEnd: 4 },
    },
    {
      pattern: /"token"\s*:\s*"([^"]+)"/gi,
      name: 'token',
      options: { showStart: 4, showEnd: 4 },
    },
    {
      pattern: /Bearer\s+([A-Za-z0-9\-._~+/]+=*)/gi,
      name: 'bearer_token',
      options: { showStart: 4, showEnd: 4 },
    },
    
    // Secrets
    {
      pattern: /(?:secret|secret[_-]?key)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'secret',
      options: { maskFull: true },
    },
    {
      pattern: /"secret"\s*:\s*"([^"]+)"/gi,
      name: 'secret',
      options: { maskFull: true },
    },
    
    // Database URLs
    {
      pattern: /(?:database[_-]?url|db[_-]?url|datasource[_-]?url)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'database_url',
      options: { showStart: 10, showEnd: 0 },
    },
    {
      pattern: /postgres(?:ql)?:\/\/(?:[^:]+):([^@]+)@/gi,
      name: 'db_password',
      options: { maskFull: true },
    },
    
    // Redis URLs
    {
      pattern: /redis(?:s)?:\/\/(?:[^:]+):([^@]+)@/gi,
      name: 'redis_password',
      options: { maskFull: true },
    },
    
    // Stripe keys
    {
      pattern: /(?:stripe[_-]?(?:secret|api)[_-]?key)\s*[:=]\s*["']?(sk_[^"'\s]+)["']?/gi,
      name: 'stripe_key',
      options: { showStart: 7, showEnd: 4 },
    },
    {
      pattern: /"stripe[_-]?(?:secret|api)[_-]?key"\s*:\s*"(sk_[^"]+)"/gi,
      name: 'stripe_key',
      options: { showStart: 7, showEnd: 4 },
    },
    
    // JWT secrets
    {
      pattern: /(?:jwt[_-]?secret)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'jwt_secret',
      options: { maskFull: true },
    },
    
    // OAuth secrets
    {
      pattern: /(?:oauth[_-]?(?:client[_-]?)?secret|client[_-]?secret)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'oauth_secret',
      options: { maskFull: true },
    },
    
    // Cloudinary
    {
      pattern: /(?:cloudinary[_-]?api[_-]?secret)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'cloudinary_secret',
      options: { maskFull: true },
    },
    
    // Email API keys
    {
      pattern: /(?:sendgrid[_-]?api[_-]?key|mailgun[_-]?api[_-]?key)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'email_api_key',
      options: { showStart: 4, showEnd: 4 },
    },
    
    // AI API keys
    {
      pattern: /(?:openai[_-]?api[_-]?key|replicate[_-]?api[_-]?token)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
      name: 'ai_api_key',
      options: { showStart: 4, showEnd: 4 },
    },
  ];

  /**
   * Sanitize a string by masking sensitive information
   */
  sanitize(input: string | any): string {
    if (typeof input !== 'string') {
      // For objects, recursively sanitize
      if (input === null || input === undefined) {
        return String(input);
      }
      
      if (Array.isArray(input)) {
        return JSON.stringify(input.map(item => {
          if (typeof item === 'object' && item !== null) {
            return this.sanitizeObject(item);
          }
          return typeof item === 'string' ? this.sanitize(item) : item;
        }));
      }
      
      if (typeof input === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(input)) {
          // Skip sensitive keys entirely or sanitize their values
          if (this.isSensitiveKey(key)) {
            const maskOptions = this.getMaskOptionsForKey(key);
            sanitized[key] = typeof value === 'string' 
              ? this.maskValue(value, maskOptions)
              : this.maskValue(String(value), maskOptions);
          } else {
            sanitized[key] = this.sanitize(value);
          }
        }
        return JSON.stringify(sanitized);
      }
      
      return String(input);
    }

    let sanitized = input;

    // Apply all patterns
    for (const { pattern, name, options } of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, (match, value) => {
        const masked = this.maskValue(value, options || {});
        return match.replace(value, masked);
      });
    }

    // Also check for sensitive keys in JSON-like structures
    sanitized = this.sanitizeJsonLike(sanitized);

    return sanitized;
  }

  /**
   * Get mask options for a sensitive key
   * SEC-10: Support amélioré pour les PII
   */
  private getMaskOptionsForKey(key: string): SanitizeOptions {
    const lowerKey = key.toLowerCase();
    
    // SEC-10: Email addresses - keep domain visible for debugging
    if (lowerKey.includes('email')) {
      return { keepDomain: true, showStart: 2, showEnd: 0 };
    }
    
    // SEC-10: Phone numbers - show last 4 digits
    if (lowerKey.includes('phone')) {
      return { showStart: 0, showEnd: 4 };
    }
    
    // SEC-10: IP addresses - show first two octets
    if (lowerKey.includes('ip')) {
      return { showStart: 0, showEnd: 0 };
    }
    
    // API keys should be partially masked
    if (lowerKey.includes('apikey') || lowerKey.includes('api_key')) {
      return { showStart: 4, showEnd: 4 };
    }
    
    // Tokens should be partially masked
    if (lowerKey.includes('token') && !lowerKey.includes('secret')) {
      return { showStart: 4, showEnd: 4 };
    }
    
    // Everything else (passwords, secrets) should be fully masked
    return { maskFull: true };
  }

  /**
   * Check if a key is sensitive
   * SEC-10: Inclut désormais les PII (email, phone, ip)
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'passwd',
      'pwd',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'api_key',
      'secret',
      'secretKey',
      'secret_key',
      'jwtSecret',
      'jwt_secret',
      'stripeSecretKey',
      'stripe_secret_key',
      'databaseUrl',
      'database_url',
      'redisUrl',
      'redis_url',
      'clientSecret',
      'client_secret',
      'cloudinaryApiSecret',
      'cloudinary_api_secret',
      // SEC-10: PII fields
      'email',
      'userEmail',
      'user_email',
      'phone',
      'phoneNumber',
      'phone_number',
      'ip',
      'ipAddress',
      'ip_address',
      'clientIp',
      'client_ip',
    ];

    const lowerKey = key.toLowerCase();
    return sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()));
  }

  /**
   * Mask a value based on options
   */
  private maskValue(value: any, options: SanitizeOptions = {}): string {
    if (value === null || value === undefined) {
      return '[null]';
    }

    const str = String(value);
    const {
      maskFull = false,
      showStart = 0,
      showEnd = 0,
      maskChar = '*',
      keepDomain = false,
    } = options;

    // SEC-10: Special handling for email addresses
    if (keepDomain && str.includes('@')) {
      const [localPart, domain] = str.split('@');
      const maskedLocal = localPart.length > 2 
        ? localPart.substring(0, 2) + maskChar.repeat(Math.min(6, localPart.length - 2))
        : maskChar.repeat(4);
      return `${maskedLocal}@${domain}`;
    }

    if (maskFull || str.length <= showStart + showEnd) {
      return maskChar.repeat(8);
    }

    const start = str.substring(0, showStart);
    const end = str.substring(str.length - showEnd);
    const middle = maskChar.repeat(Math.max(4, str.length - showStart - showEnd));

    return `${start}${middle}${end}`;
  }
  
  /**
   * SEC-10: Masque une adresse email en gardant le domaine visible
   * @example "john.doe@example.com" => "jo****@example.com"
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return email;
    }
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(Math.min(6, localPart.length - 2))
      : '****';
    return `${maskedLocal}@${domain}`;
  }
  
  /**
   * SEC-10: Masque un numéro de téléphone en ne gardant que les 4 derniers chiffres
   * @example "+33612345678" => "****5678"
   */
  maskPhone(phone: string): string {
    if (!phone) return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) return '****';
    return '****' + digits.slice(-4);
  }
  
  /**
   * SEC-10: Masque une adresse IP
   * @example "192.168.1.1" => "192.168.***.***"
   */
  maskIpAddress(ip: string): string {
    if (!ip) return ip;
    const parts = ip.split('.');
    if (parts.length !== 4) return ip;
    return `${parts[0]}.${parts[1]}.***.***`;
  }

  /**
   * Sanitize JSON-like strings
   */
  private sanitizeJsonLike(input: string): string {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(input);
      const sanitized = this.sanitize(parsed);
      return typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);
    } catch {
      // Not valid JSON, return as is (already sanitized by patterns)
      return input;
    }
  }

  /**
   * Sanitize an object recursively
   */
  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Preserve primitive types (number, boolean, etc.)
    if (typeof obj !== 'object') {
      // Only sanitize strings, preserve other primitives
      if (typeof obj === 'string') {
        return this.sanitize(obj);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveKey(key)) {
        // Determine mask options based on key type
        const maskOptions = this.getMaskOptionsForKey(key);
        sanitized[key] = typeof value === 'string' 
          ? this.maskValue(value, maskOptions)
          : this.maskValue(String(value), maskOptions);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else if (typeof value === 'string') {
        // Only sanitize strings, preserve other primitives
        sanitized[key] = this.sanitize(value);
      } else {
        // Preserve primitive types (number, boolean, etc.)
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

