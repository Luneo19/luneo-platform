/**
 * Jest Setup - Configuration globale pour les tests
 * S'exécute avant chaque test
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

// Mock console methods to reduce noise in tests (keep errors visible for debugging)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error visible for debugging failed tests
  error: console.error,
};

// Ensure test environment
process.env.NODE_ENV = 'test';

// Fallback values if .env.test is not loaded
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:testpassword@localhost:5433/luneo_test?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6380';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-32chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-testing-32chars';
process.env.JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'test-reset-secret-key-for-testing-32chars';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock_secret_for_testing';

// Disable external services in tests
process.env.MOCK_EXTERNAL_SERVICES = 'true';
process.env.EMAIL_ENABLED = 'false';
process.env.CAPTCHA_ENABLED = 'false';
process.env.SKIP_EMAIL_VERIFICATION = 'true';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
beforeAll(() => {
  // Any global setup can go here
});

afterAll(() => {
  // Any global cleanup can go here
});
