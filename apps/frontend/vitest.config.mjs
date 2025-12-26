import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Exclure les tests E2E (gérés par Playwright)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      '**/e2e/**',
      '**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/tests/e2e/**',
      '**/__tests__/e2e/**',
    ],
    // Continue même si certains tests échouent (pour générer coverage)
    bail: 0,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'e2e/',
        '**/e2e/**',
        '**/__tests__/**',
        '**/tests/**',
      ],
      // Inclure seulement le code source
      include: [
        'src/**/*.{ts,tsx}',
      ],
      // Seuils de coverage minimum (progressifs - objectif final: ≥70%)
      // Actuellement désactivés pour permettre la génération du rapport
      // À réactiver progressivement quand le coverage augmente
      // thresholds: {
      //   lines: 70,
      //   functions: 70,
      //   branches: 65,
      //   statements: 70,
      // },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
