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
        'components/index.ts', // Archivo de exportaciones
        'index.html', // Archivo HTML
        'types/calendar.ts', // Tipos simples
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Thresholds específicos por directorio
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
