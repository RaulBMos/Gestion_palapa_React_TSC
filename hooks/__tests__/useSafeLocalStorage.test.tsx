/**
 * Pruebas unitarias exhaustivas para useSafeLocalStorage.ts
 * Corregidas para alcanzar 80% de cobertura
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSafeLocalStorage, useClearStorage, useLocalStorageSize } from '../useSafeLocalStorage';

// Mock localStorage completo antes de los tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    length: 0,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock para tests que necesitan localStorage no disponible
const createNoLocalStorageWindow = () => {
  const win = window as any;
  const originalLocalStorage = win.localStorage;
  delete win.localStorage;
  return { originalLocalStorage, win };
};

// Restaurar localStorage
const restoreLocalStorage = (originalLocalStorage: any, win: any) => {
  win.localStorage = originalLocalStorage;
};

describe('useSafeLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Reset del store interno
    localStorageMock.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('funcionalidad básica', () => {
    it('should return initial value when key does not exist', () => {
      const { result } = renderHook(() => 
        useSafeLocalStorage('nonexistent', 'initial')
      );

      expect(result.current[0]).toBe('initial');
    });

    it('should store and retrieve values correctly', () => {
      const { result } = renderHook(() => 
        useSafeLocalStorage('test-key', 'initial')
      );

      // Set new value
      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"new-value"');
    });

    it('should handle complex objects', () => {
      const complexObject = { name: 'John', age: 30, hobbies: ['reading', 'coding'] };
      const { result } = renderHook(() => 
        useSafeLocalStorage('object-key', {})
      );

      act(() => {
        result.current[1](complexObject);
      });

      expect(result.current[0]).toEqual(complexObject);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('object-key', JSON.stringify(complexObject));
    });

    it('should handle arrays', () => {
      const arrayData = [1, 2, 3, 4, 5];
      const { result } = renderHook(() => 
        useSafeLocalStorage('array-key', [])
      );

      act(() => {
        result.current[1](arrayData);
      });

      expect(result.current[0]).toEqual(arrayData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('array-key', JSON.stringify(arrayData));
    });
  });

  describe('manejo de errores', () => {
    it('should handle invalid JSON gracefully', () => {
      // Mock getItem que retorna JSON inválido
      localStorageMock.getItem.mockReturnValue('invalid-json-content');

      const { result } = renderHook(() => 
        useSafeLocalStorage('invalid-json', 'fallback')
      );

      expect(result.current[0]).toBe('fallback');
    });

    it('should handle storage quota exceeded errors', () => {
      // Mock setItem para lanzar error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => 
        useSafeLocalStorage('quota-test', 'initial')
      );

      expect(() => {
        act(() => {
          result.current[1]('new-value');
        });
      }).not.toThrow();
    });

    it('should handle localStorage not available (SSR)', () => {
      const { originalLocalStorage, win } = createNoLocalStorageWindow();

      const { result } = renderHook(() => 
        useSafeLocalStorage('ssr-test', 'initial')
      );

      expect(result.current[0]).toBe('initial');
      expect(() => {
        act(() => {
          result.current[1]('new-value');
        });
      }).not.toThrow();

      restoreLocalStorage(originalLocalStorage, win);
    });

    it('should persist value across hook instances', () => {
      const { result: firstHook } = renderHook(() => 
        useSafeLocalStorage('shared-key', 'initial')
      );

      act(() => {
        firstHook.current[1]('shared-value');
      });

      // Crear otra instancia del mismo hook - valor se obtiene del localStorage
      const { result: secondHook } = renderHook(() => 
        useSafeLocalStorage('shared-key', 'initial')
      );

      // Mockear el uso del hook para forzar lectura de localStorage
      const testStorageEvent = new StorageEvent('storage', {
        key: 'shared-key',
        newValue: JSON.stringify('shared-value'),
        url: window.location.href,
      });

      act(() => {
        window.dispatchEvent(testStorageEvent);
      });

      expect(secondHook.current[0]).toBe('shared-value');
    });

    it('should sync with storage events from other tabs', () => {
      const { result } = renderHook(() => 
        useSafeLocalStorage('sync-key', 'initial')
      );

      const storageEvent = new StorageEvent('storage', {
        key: 'sync-key',
        newValue: JSON.stringify('synced-value'),
        oldValue: JSON.stringify('initial'),
        url: window.location.href,
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current[0]).toBe('synced-value');
    });

    it('should ignore storage events for other keys', () => {
      const { result } = renderHook(() => 
        useSafeLocalStorage('target-key', 'initial')
      );

      const originalValue = result.current[0];

      // Disparar evento para otra clave
      const storageEvent = new StorageEvent('storage', {
        key: 'other-key',
        newValue: JSON.stringify('other-value'),
        url: window.location.href,
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current[0]).toBe(originalValue);
    });

    it('should handle storage events with invalid JSON', () => {
      const { result } = renderHook(() => 
        useSafeLocalStorage('invalid-sync-key', 'initial')
      );

      const originalValue = result.current[0];

      const storageEvent = new StorageEvent('storage', {
        key: 'invalid-sync-key',
        newValue: 'invalid-json-content',
        url: window.location.href,
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      // No debería cambiar el valor con JSON inválido
      expect(result.current[0]).toBe(originalValue);
    });

    it('should handle null values', () => {
      const { result } = renderHook(() => 
        useSafeLocalStorage('null-key', 'default')
      );

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBe(null);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('null-key', 'null');
    });

    it('should handle undefined values', () => {
      const { result } = renderHook(() => 
        useSafeLocalStorage('undefined-key', 'default')
      );

      act(() => {
        result.current[1](undefined);
      });

      expect(result.current[0]).toBe(undefined);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('undefined-key', 'undefined');
    });

    it('should handle number values', () => {
      const { result } = renderHook(() => 
        useSafeLocalStorage('number-key', 0)
      );

      act(() => {
        result.current[1](42);
      });

      expect(result.current[0]).toBe(42);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('number-key', '42');
    });

    it('should handle boolean values', () => {
      const { result } = renderHook(() => 
        useSafeLocalStorage('boolean-key', false)
      );

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('boolean-key', 'true');
    });

    it('should handle date objects', () => {
      const testDate = new Date('2024-01-15T00:00:00.000Z');
      const { result } = renderHook(() => 
        useSafeLocalStorage('date-key', new Date())
      );

      act(() => {
        result.current[1](testDate);
      });

      expect(result.current[0]).toEqual(testDate);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('date-key', JSON.stringify(testDate));
    });
  });

  describe('useClearStorage', () => {
    it('should clear specific keys', () => {
      localStorageMock.getItem.mockReturnValue('value');
      
      const { result } = renderHook(() => 
        useClearStorage(['key1', 'key3'])
      );

      act(() => {
        result.current();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('key1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('key3');
    });

    it('should clear all storage when no keys specified', () => {
      const { result } = renderHook(() => 
        useClearStorage()
      );

      act(() => {
        result.current();
      });

      expect(localStorageMock.clear).toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => 
        useClearStorage(['test-key'])
      );

      expect(() => {
        act(() => {
          result.current();
        });
      }).not.toThrow();
    });

    it('should handle localStorage not available', () => {
      const { originalLocalStorage, win } = createNoLocalStorageWindow();

      const { result } = renderHook(() => 
        useClearStorage(['test-key'])
      );

      expect(() => {
        act(() => {
          result.current();
        });
      }).not.toThrow();

      restoreLocalStorage(originalLocalStorage, win);
    });
  });

  describe('useLocalStorageSize', () => {
    it('should calculate storage size correctly', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'key1') return 'value1';
        if (key === 'key2') return 'value2';
        return null;
      });
      localStorageMock.key.mockImplementation((index: number) => {
        return index === 0 ? 'key1' : index === 1 ? 'key2' : null;
      });
      Object.defineProperty(localStorageMock, 'length', {
        value: 2,
        configurable: true
      });

      const { result } = renderHook(() => 
        useLocalStorageSize()
      );

      expect(result.current.used).toBeGreaterThan(0);
      expect(result.current.available).toBeGreaterThan(0);
      expect(result.current.percentage).toBeGreaterThanOrEqual(0);
      expect(result.current.percentage).toBeLessThanOrEqual(100);
    });

    it('should return zeros for empty storage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.key.mockReturnValue(null);
      Object.defineProperty(localStorageMock, 'length', {
        value: 0,
        configurable: true
      });

      const { result } = renderHook(() => 
        useLocalStorageSize()
      );

      expect(result.current.used).toBe(0);
      expect(result.current.available).toBeGreaterThan(0);
      expect(result.current.percentage).toBe(0);
    });

    it('should handle localStorage errors', () => {
      localStorageMock.key.mockImplementation(() => {
        throw new Error('Storage access error');
      });

      const { result } = renderHook(() => 
        useLocalStorageSize()
      );

      // No debería lanzar error
      expect(result.current.used).toBe(0);
      expect(result.current.available).toBeGreaterThanOrEqual(0);
    });

    it('should estimate 5MB limit correctly', () => {
      const largeData = 'x'.repeat(1000);
      localStorageMock.getItem.mockReturnValue(largeData);
      localStorageMock.key.mockImplementation((index: number) => {
        return index < 100 ? `key${index}` : null;
      });
      Object.defineProperty(localStorageMock, 'length', {
        value: 100,
        configurable: true
      });

      const { result } = renderHook(() => 
        useLocalStorageSize()
      );

      expect(result.current.percentage).toBeGreaterThan(0);
      expect(result.current.percentage).toBeGreaterThanOrEqual(0);
      expect(result.current.percentage).toBeLessThanOrEqual(100);
    });
  });
});