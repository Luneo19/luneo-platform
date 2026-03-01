// Separate unit tests from integration/e2e/chaos/security tests:
// - Default (pnpm test): only unit tests in src/ directory
// - RUN_INTEGRATION_TESTS=true: integration, chaos, security, contract, mutation tests in test/
// - pnpm run test:all: everything
const isIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
const isAll = process.env.RUN_ALL_TESTS === 'true';
const testRegex = isAll
  ? '.*\\.spec\\.ts$'
  : isIntegration
    ? '(test/|integration\\.spec\\.ts$)'
    : 'src/.*\\.spec\\.ts$';

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  testRegex,
  testPathIgnorePatterns: isIntegration ? [] : ['integration\\.spec\\.ts$'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: { skipLibCheck: true } }],
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.spec.ts',
    '!src/**/test/**',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/common/(.*)$': '<rootDir>/src/common/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@/libs/(.*)$': '<rootDir>/src/libs/$1',
    // Mock native canvas module (not available outside Docker)
    '^canvas$': '<rootDir>/src/common/test/__mocks__/canvas.ts',
    // Mock Pinecone (optional dependency, not needed for unit tests)
    '^@pinecone-database/pinecone$': '<rootDir>/src/common/test/__mocks__/pinecone.ts',
  },
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 20,
      statements: 20,
    },
  },
  testTimeout: 30000,
  // Use sequential execution to prevent database conflicts in integration tests
  maxWorkers: process.env.RUN_INTEGRATION_TESTS === 'true' ? 1 : 4,
  setupFilesAfterEnv: ['<rootDir>/src/common/test/jest.setup.ts'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

