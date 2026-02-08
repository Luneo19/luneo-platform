/**
 * Application-wide constants for the Luneo backend.
 * Centralizes magic numbers for maintainability.
 */

// Timeouts (milliseconds)
export const TIMEOUTS = {
  REDIS_CONNECT: 10_000,
  REDIS_COMMAND: 5_000,
  RETRY_DELAY: 2_000,
  POLLING_INTERVAL: 5_000,
  EXTERNAL_API: 30_000,
} as const;

// Rate limits
export const RATE_LIMITS = {
  AUTH: {
    LOGIN: { limit: 5, ttl: 60_000 },
    SIGNUP: { limit: 5, ttl: 60_000 },
    FORGOT_PASSWORD: { limit: 3, ttl: 60_000 },
    RESET_PASSWORD: { limit: 5, ttl: 60_000 },
    REFRESH: { limit: 10, ttl: 60_000 },
  },
} as const;

// Rendering
export const RENDER_DEFAULTS = {
  MAX_WIDTH: 3000,
  MAX_HEIGHT: 3000,
  DEFAULT_DPI: 300,
} as const;

// Cache durations (seconds)
export const CACHE_DURATIONS = {
  SHORT: 30 * 60,          // 30 minutes
  MEDIUM: 24 * 60 * 60,    // 24 hours
  LONG: 30 * 24 * 60 * 60, // 30 days
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  DEFAULT_OFFSET: 0,
  MAX_LIMIT: 100,
} as const;
