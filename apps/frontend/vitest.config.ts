import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/e2e/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'src/components/__a11y__/**/*.axe.ts',
    ],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/lib/rate-limit.ts'],
      exclude: ['src/lib/__tests__/**'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});

