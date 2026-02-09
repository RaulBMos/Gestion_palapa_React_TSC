import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useSafeLocalStorage } from '@/hooks/useSafeLocalStorage';

describe('useSafeLocalStorage', () => {
  const STORAGE_KEY = 'safe-storage-test';

  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('devuelve el valor inicial cuando no hay dato en storage', () => {
    const getItemSpy = vi.spyOn(window.localStorage, 'getItem');
    const { result } = renderHook(() => useSafeLocalStorage(STORAGE_KEY, 'initial'));

    expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    expect(result.current[0]).toBe('initial');
  });

  it('persiste el valor en localStorage y actualiza el estado', async () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem');
    const { result } = renderHook(() => useSafeLocalStorage(STORAGE_KEY, 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    await vi.waitFor(() => {
      expect(result.current[0]).toBe('updated');
    });

    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify('updated'));
  });

  it('maneja correctamente errores de QuotaExceeded', async () => {
    const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw quotaError;
    });

    const { result } = renderHook(() => useSafeLocalStorage(STORAGE_KEY, 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    await vi.waitFor(() => {
      expect(result.current[0]).toBe('new-value');
    });

    expect(setItemSpy).toHaveBeenCalled();
  });

  it('remueve la clave cuando el valor es undefined', () => {
    const removeItemSpy = vi.spyOn(window.localStorage, 'removeItem');
    const { result } = renderHook(() => useSafeLocalStorage(STORAGE_KEY, 'initial'));

    act(() => {
      result.current[1](undefined as unknown as string);
    });

    expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    expect(result.current[0]).toBeUndefined();
  });
});
