module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'src/jobs/services/**/*.ts',
    'src/modules/ai/services/**/*.ts',
    'src/modules/orders/**/*.ts',
    'src/modules/production/services/**/*.ts',
    'src/modules/render/services/**/*.ts',
    '!src/modules/**/**/*.spec.ts',
    '!src/modules/**/**/*.controller.ts',
    '!src/modules/**/**/*.module.ts',
    '!src/modules/**/dto/**/*.ts',
    '!src/modules/render/services/render-2d.service.ts',
    '!src/modules/render/services/render-3d.service.ts',
    '!src/modules/render/services/render-queue.service.ts',
    '!src/modules/render/services/export.service.ts',
    '!src/jobs/services/queue-health.service.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 30000,
  maxWorkers: 4,
};

