import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // `.pnpm-store` can hold git-dependency clone staging (lintable sources).
  { ignores: ['dist', 'dist-e2e', 'node_modules', 'coverage', '.pnpm-store', '**/*.timestamp*'] },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.test.json'],
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // `_`-prefixed bindings are intentionally unused — typically parameters an
      // interface requires but a given implementation ignores.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // The Google emulator (google-drive-api-mock, a devDependency) must
    // never enter the app bundle; tests may import it, src may not. CI
    // greps dist/ as a second tripwire.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['google-drive-api-mock', 'google-drive-api-mock/*'],
              message:
                'src/ must not import the emulator — test-only code stays out of the prod bundle.',
            },
          ],
        },
      ],
    },
  }
)
