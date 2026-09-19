import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // `.claude/worktrees/` holds whole checkouts of other branches, so linting it
  // reports thousands of errors locally that CI, which never has it, cannot see.
  { ignores: ['dist', 'dist-e2e', 'node_modules', 'coverage', '.claude', '**/*.timestamp*'] },
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
    // The e2e-only live-Drive/Sheets double must never reach a production
    // bundle: `src/` importing it would ship a test-only dependency.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['google-drive-api-mock', 'google-drive-api-mock/*'],
              message:
                'google-drive-api-mock is a test-only e2e double and must not be imported from src/.',
            },
          ],
        },
      ],
    },
  }
)
