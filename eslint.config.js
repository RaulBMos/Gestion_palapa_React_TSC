import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      'prefer-const': 'off',
      'no-unused-vars': 'off'
    },
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts'
    ]
  },
  {
    files: ['dist/**/*.js', 'public/**/*.js', 'server/**/*.js'],
    rules: {
      'no-unused-vars': 'off',
      'no-func-assign': 'off',
      'no-cond-assign': 'off',
      'no-fallthrough': 'off',
      'no-prototype-builtins': 'off',
      'no-control-regex': 'off',
      'no-misleading-character-class': 'off',
      'no-useless-escape': 'off',
      'no-constant-binary-expression': 'off',
      'no-constant-condition': 'off',
      'valid-typeof': 'off',
      'no-unreachable': 'off',
      'getter-return': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'no-redeclare': 'off'
    }
  },
  {
    files: ['**/*.config.js', '**/*.config.ts', 'server/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly'
      }
    }
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'hooks/**/*.ts', 'components/**/*.tsx', 'contexts/**/*.tsx', 'services/**/*.ts', 'utils/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
]