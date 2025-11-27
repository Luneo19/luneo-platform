/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    // Environnement
    environment: 'jsdom',
    globals: true,
    
    // Setup
    setupFiles: ['./vitest.setup.ts'],
    
    // Fichiers de test
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.test.tsx',
    ],
    
    // Exclusions
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'out/**',
      'tests/e2e/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'src/components/__a11y__/**/*.axe.ts',
      'coverage/**',
    ],
    
    // Coverage configuration
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/components/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/store/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/types/**',
        'src/app/**',
      ],
    },
    
    // Reporters
    reporters: ['default'],
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Watch mode désactivé
    watch: false,
    
    // Passer sans tests
    passWithNoTests: true,
    
    // Deps
    deps: {
      inline: [/@testing-library/],
    },
  },
  
  // Alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/services': path.resolve(__dirname, './src/services'),
    },
  },
});
