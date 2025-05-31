import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['cjs'],
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  target: 'node22',
  keepNames: true,
  skipNodeModulesBundle: true,
  external: [
    // Keep these as external since they're native modules or need special handling
    'playwright',
    'sharp',
    'redis',
    '@playwright/test'
  ],
  onSuccess: async () => {
    console.log('✅ Build completed successfully')
  }
})