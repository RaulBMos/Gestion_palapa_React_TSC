# Husky + Lint-staged Configuration Guide

## Installation Commands

```bash
# Install core dependencies
npm install --save-dev husky lint-staged

# Install ESLint and plugins for TypeScript + React
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks eslint-plugin-react-refresh globals

# Install additional dependencies
npm install --save-dev @eslint/js

# Initialize Git (if not already initialized)
git init

# Initialize Husky
npx husky init

# Make the pre-commit hook executable (Unix/Linux/Mac)
chmod +x .husky/pre-commit
```

## Configuration Files

### 1. `eslint.config.js`

```javascript
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
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      'prefer-const': 'off',
      'no-unused-vars': 'off'
    },
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '*.config.js',
      '*.config.ts'
    ]
  }
]
```

### 2. `package.json` Scripts & Configuration

```json
{
  "scripts": {
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "git add"
    ]
  },
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^16.2.7",
    "eslint": "^9.39.2",
    "@typescript-eslint/eslint-plugin": "^8.53.1",
    "@typescript-eslint/parser": "^8.53.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.26",
    "@eslint/js": "^9.39.2",
    "globals": "^15.0.0"
  }
}
```

### 3. `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# 1. Run ESLint
echo "📝 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint failed. Please fix the linting errors above."
  echo "💡 You can run 'npm run lint:fix' to auto-fix some issues."
  exit 1
fi

# 2. Run unit tests
echo "🧪 Running unit tests..."
npm run test:run
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please fix the failing tests above."
  exit 1
fi

# 3. Run tests with coverage and check 80% threshold
echo "📊 Running coverage check..."
npm run test:coverage
if [ $? -ne 0 ]; then
  echo "❌ Coverage is below 80% threshold. Please add more tests."
  echo "💡 Check the coverage report for uncovered areas."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
echo "🚀 Commit is ready to be saved."
```

### 4. `vitest.config.ts` (Coverage Thresholds)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'components/index.ts',
        'index.html',
        'types/calendar.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        './services/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        './hooks/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        './utils/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

## Usage

### Commands

```bash
# Run linting manually
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Test pre-commit hook (bypass git hook)
npx husky pre-commit
```

### Commit Process

1. Add files to staging: `git add .`
2. Commit: `git commit -m "Your commit message"`
3. Pre-commit hooks will automatically run:
   - ESLint validation
   - Unit tests execution  
   - Coverage threshold check (80% minimum)
4. If all checks pass, commit is created
5. If any check fails, commit is blocked

### Troubleshooting

```bash
# Skip hooks (not recommended)
git commit --no-verify -m "message"

# Re-run hooks manually
npx husky pre-commit

# Update hooks after changes
npx husky install
```

## Benefits

✅ **Code Quality**: Automatic linting on every commit  
✅ **Test Coverage**: Ensures minimum 80% coverage  
✅ **Consistency**: Enforces coding standards  
✅ **Early Detection**: Catches issues before they reach main branch  
✅ **Team Workflow**: All developers follow same standards