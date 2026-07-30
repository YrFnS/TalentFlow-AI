import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // The inherited repository still contains many explicitly marked legacy
      // files. TypeScript validation remains a separate required CI step, so
      // lint should report actionable code issues instead of failing once per
      // legacy @ts-nocheck header.
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',

      // React Compiler rules currently flag several established third-party
      // hook patterns (notably dnd-kit refs) and inherited placeholder pages.
      // Keep conventional React Hooks rules enabled while these surfaces are
      // migrated incrementally.
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      '@next/next/no-img-element': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'public/uploads/**',
    'next-env.d.ts',
  ]),
]);
