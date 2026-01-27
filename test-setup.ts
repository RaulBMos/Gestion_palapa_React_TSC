import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach } from 'vitest';

// Configuración global para Vitest con Testing Library
beforeAll(() => {
  // Limpiar el DOM antes de cada test
  document.body.innerHTML = '';
});

afterEach(() => {
  // Limpiar el DOM después de cada test
  document.body.innerHTML = '';
});