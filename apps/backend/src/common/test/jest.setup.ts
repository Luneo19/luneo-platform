/**
 * Jest Setup - Configuration globale pour les tests
 * S'exécute avant chaque test
 */

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';

// Increase timeout for integration tests
jest.setTimeout(30000);

