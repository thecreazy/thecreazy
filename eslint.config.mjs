import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'

export default tseslint.config(
  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Astro files
  ...astro.configs.recommended,

  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**', 'src/env.d.ts'],
  },

  // TypeScript + JS files
  {
    files: ['**/*.ts', '**/*.js', '**/*.mjs'],
    rules: {
      // Allow console.warn/error but flag console.log
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // TS-specific
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Astro-specific overrides
  {
    files: ['**/*.astro'],
    rules: {
      // Astro uses inline scripts — allow console.warn/error
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
)
