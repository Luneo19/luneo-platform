import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  globalName: 'LuneoWidget',
  outDir: 'dist',
  external: [],
  banner: {
    js: `/* Luneo Widget SDK v2.0.0 */`,
  },
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : format === 'esm' ? '.mjs' : '.js',
    };
  },
});
