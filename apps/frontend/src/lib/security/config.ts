/**
 * Security Configuration
 * Centralised security settings for the application
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

export const securityConfig = {
  // Session settings
  session: {
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    refreshThreshold: 60 * 60, // Refresh if less than 1 hour remaining
  },

  // Password requirements
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: false,
    blockedPasswords: [
      'password', 'password123', '12345678', 'qwerty123',
      'admin123', 'letmein', 'welcome1', 'monkey123',
    ],
  },

  // Rate limiting
  rateLimit: {
    // Login attempts
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    },
    // Password reset
    passwordReset: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
    // API calls
    api: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    },
    // File uploads
    upload: {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
    },
  },

  // File upload limits
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf'],
  },

  // CORS settings
  cors: {
    allowedOrigins: [
      APP_URL,
      'https://www.luneo.app',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // Content Security Policy
  // NOTE: Use nonce-based CSP via middleware for better security
  // These directives are fallback for non-nonce scenarios
  csp: {
    // Nonce-based directives (preferred - used by middleware)
    nonceDirectives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        // Nonce will be added dynamically: "'nonce-{nonce}'"
        'https://js.stripe.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://vercel.live',
      ],
      styleSrc: [
        "'self'",
        // Nonce will be added dynamically: "'nonce-{nonce}'"
        'https://fonts.googleapis.com',
      ],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: [
        "'self'",
        'https://api.stripe.com',
        'https://*.sentry.io',
        'https://www.google-analytics.com',
        'https://vitals.vercel-insights.com',
      ],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: true,
    },
    // Fallback directives (legacy - only used when DISABLE_CSP_NONCES=true)
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Only for legacy fallback
        "'unsafe-eval'",
        'https://js.stripe.com',
        'https://www.googletagmanager.com',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: [
        "'self'",
        'https://api.stripe.com',
        'https://*.sentry.io',
      ],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },

  // Sensitive data patterns to redact in logs
  sensitivePatterns: [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /authorization/i,
    /credit[_-]?card/i,
    /ssn/i,
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card numbers
    /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/, // SSN
  ],

  // IP blocking
  ipBlocking: {
    enabled: true,
    maxFailedAttempts: 10,
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Two-Factor Authentication
  twoFactor: {
    issuer: 'Luneo',
    digits: 6,
    period: 30, // seconds
    algorithm: 'SHA1',
    backupCodesCount: 10,
  },
};

/**
 * Validate password against security requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { password: config } = securityConfig;

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters`);
  }

  if (password.length > config.maxLength) {
    errors.push(`Password must be less than ${config.maxLength} characters`);
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  if (config.blockedPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Redact sensitive data from objects (for logging)
 */
export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    let redacted = data;
    for (const pattern of securityConfig.sensitivePatterns) {
      if (pattern.test(data)) {
        redacted = '[REDACTED]';
        break;
      }
    }
    return redacted;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  if (typeof data === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const shouldRedact = securityConfig.sensitivePatterns.some(pattern =>
        pattern.test(key)
      );
      redacted[key] = shouldRedact ? '[REDACTED]' : redactSensitiveData(value);
    }
    return redacted;
  }

  return data;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      token += chars[values[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return token;
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(mimeType: string, filename: string): boolean {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  
  return (
    securityConfig.upload.allowedMimeTypes.includes(mimeType) &&
    securityConfig.upload.allowedExtensions.includes(extension)
  );
}

export default securityConfig;

